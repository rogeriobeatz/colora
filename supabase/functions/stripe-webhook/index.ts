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
      status: 200, // Return 200 so Stripe doesn't keep retrying
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
    // Handle invoice.paid for subscription RENEWALS (not initial payment)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      if (customerId) {
        logStep("Processing invoice.paid", { customerId });
        
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

          logStep("Tokens renewed", { customerId, newTokens });
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
