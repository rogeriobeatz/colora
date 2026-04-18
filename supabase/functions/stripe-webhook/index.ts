import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step} - ${JSON.stringify(details || {})}`);
};

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers });
  
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error("[STRIPE-WEBHOOK] Missing configuration");
    return new Response(JSON.stringify({ error: "Service configuration error" }), { headers, status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const sig = req.headers.get("Stripe-Signature");

  if (!sig) {
    console.error("[STRIPE-WEBHOOK] Missing Stripe-Signature");
    return new Response(JSON.stringify({ error: "Missing signature" }), { headers, status: 400 });
  }

  try {
    const body = await req.text();
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[STRIPE-WEBHOOK] Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { headers, status: 400 });
    }

    logStep("Event Received", { type: event.type });

    // Handle both Subscriptions (invoice.paid) and One-time purchases (checkout.session.completed)
    if (event.type === "invoice.paid" || event.type === "checkout.session.completed") {
      let customerId: string | null = null;
      let externalId: string | null = null;
      let amount = 200; // Default fallback
      let source = '';
      let metadata: any = {};

      if (event.type === "invoice.paid") {
        const invoice = event.data.object as Stripe.Invoice;
        customerId = invoice.customer as string;
        externalId = invoice.id;
        source = 'stripe_invoice';
        // Subscriptions usually have a fixed amount in this version
        amount = 200; 
      } else {
        const session = event.data.object as Stripe.Checkout.Session;
        // Only process session if it's NOT a subscription (those are handled by invoice.paid)
        if (session.mode === 'subscription') {
          logStep("Subscription session - waiting for invoice.paid", { sessionId: session.id });
          return new Response(JSON.stringify({ received: true }), { headers, status: 200 });
        }
        customerId = session.customer as string;
        externalId = session.id;
        source = 'stripe_checkout';
        metadata = session.metadata || {};
        
        // If it's a recharge, it might have a specific amount in metadata or we default to recharge amount
        if (metadata.is_recharge === 'true') {
          amount = 100; // Example: package of 100 tokens for recharge
          logStep("Processing recharge", { sessionId: session.id, amount });
        }
      }

      if (!customerId || !externalId) {
        console.error("[STRIPE-WEBHOOK] Missing customer or external ID");
        return new Response(JSON.stringify({ received: true }), { headers, status: 200 });
      }

      // STRICT IDEMPOTENCY CHECK
      const { data: existing } = await supabaseAdmin
        .from("token_consumptions")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();

      if (existing) {
        logStep("Duplicate Event Ignored", { externalId });
        return new Response(JSON.stringify({ received: true, duplicate: true }), { headers, status: 200 });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, tokens, account_type")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (profile) {
        // Update profile
        const updates: any = { 
          tokens: (profile.tokens || 0) + amount,
          subscription_status: "active"
        };
        
        // If they were a trial or churned, they are now a subscriber
        if (profile.account_type !== 'subscriber') {
          updates.account_type = 'subscriber';
        }

        const { error: updateError } = await supabaseAdmin.from("profiles").update(updates).eq('id', profile.id);
        if (updateError) console.error("[STRIPE-WEBHOOK] Profile update error:", updateError.message);

        // Record consumption (as a credit)
        const { error: insertError } = await supabaseAdmin.from("token_consumptions").insert({
          user_id: profile.id,
          amount,
          description: event.type === "invoice.paid" ? `Assinatura: ${externalId}` : `Recarga de Créditos: ${externalId}`,
          external_id: externalId,
          source: source,
          metadata: { stripe_event: event.type, ...metadata }
        });

        if (insertError) console.error("[STRIPE-WEBHOOK] Token record error:", insertError.message);
        
        logStep("Tokens Credited Successfully", { profileId: profile.id, amount, source });
      } else {
        logStep("No profile found for customer", { customerId });
        // Optional: Search by email if customer_id link is missing
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ subscription_status: "inactive", account_type: "churned" })
        .eq("stripe_customer_id", customerId);
      
      if (updateError) {
        console.error("[STRIPE-WEBHOOK] Profile churn update error:", updateError.message);
      }
      
      logStep("Subscription Terminated", { customer: customerId });
    }

    return new Response(JSON.stringify({ received: true }), { headers, status: 200 });
  } catch (err: any) {
    console.error("[STRIPE-WEBHOOK] Global Error:", err.message);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { headers, status: 400 });
  }
});
