import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers });
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("Stripe keys not configured - webhook is backup only, skipping");
    return new Response(JSON.stringify({ error: "Webhook not configured (non-critical)" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const stripeSignature = req.headers.get("Stripe-Signature");
  if (!stripeSignature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR: Signature verification failed", { message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // Handle invoice.paid for subscription RENEWALS only
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const invoiceId = invoice.id;

      if (customerId && invoiceId) {
        logStep("Processing invoice.paid", { customerId, invoiceId });

        // IDEMPOTENCY CHECK: Skip if this invoice was already credited
        const { data: existingCredit } = await supabaseAdmin
          .from("token_consumptions")
          .select("id")
          .ilike("description", `%${invoiceId}%`)
          .maybeSingle();

        if (existingCredit) {
          logStep("Invoice already credited, skipping", { invoiceId });
          return new Response(JSON.stringify({ received: true, skipped: true }), {
            headers: { ...headers, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Also check if this is the INITIAL invoice (billing_reason)
        // For initial payments, generate-auth-link already handles crediting
        const billingReason = (invoice as any).billing_reason;
        logStep("Invoice billing reason", { billingReason });

        if (billingReason === "subscription_create") {
          // Check if generate-auth-link already credited via session ID
          const sessionId = (invoice as any).subscription_details?.metadata?.payment_session 
            || (invoice as any).metadata?.payment_session;
          
          // For initial subscriptions, check if ANY credit exists for this customer recently
          const { data: recentCredit } = await supabaseAdmin
            .from("token_consumptions")
            .select("id")
            .ilike("description", `%Sessão:%`)
            .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // last 5 minutes
            .limit(1);

          // Look up profile by stripe_customer_id
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, tokens")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile && recentCredit && recentCredit.length > 0) {
            logStep("Initial invoice - tokens already credited by generate-auth-link, skipping", { customerId });
            return new Response(JSON.stringify({ received: true, skipped: true }), {
              headers: { ...headers, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
        
        // This is a RENEWAL or a missed initial credit - proceed
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, tokens")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const newTokens = (profile.tokens || 0) + 200;
          await supabaseAdmin
            .from("profiles")
            .update({
              tokens: newTokens,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          // Record the credit with invoice ID for idempotency
          await supabaseAdmin.from("token_consumptions").insert({
            user_id: profile.id,
            amount: 200,
            description: `Renovação de assinatura - Invoice: ${invoiceId}`,
          });

          logStep("Tokens renewed", { customerId, newTokens, invoiceId });
        } else {
          logStep("No profile found for customer", { customerId });
        }
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

      if (customerId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "inactive", updated_at: new Date().toISOString() })
            .eq("id", profile.id);
          logStep("Subscription canceled", { customerId });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("CRITICAL ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
