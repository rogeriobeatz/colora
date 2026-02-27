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
    return new Response(JSON.stringify({ error: "Stripe keys not configured" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
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
  } catch (err: any) {
    logStep("Signature verification failed", { message: err?.message });
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
    if (event.type !== "invoice.paid") {
      return new Response(JSON.stringify({ received: true, ignored: event.type }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (!customerId) {
      return new Response(JSON.stringify({ error: "Missing customer" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (invoice.billing_reason && !["subscription_cycle", "subscription_create"].includes(invoice.billing_reason)) {
      return new Response(JSON.stringify({ received: true, ignored: "billing_reason" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, tokens, tokens_expires_at")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);
    const newTokens = (profile.tokens || 0) + 200;

    await supabaseAdmin
      .from("profiles")
      .update({
        tokens: newTokens,
        tokens_expires_at: newExpiresAt.toISOString(),
        subscription_status: "active",
      })
      .eq("id", profile.id);

    await supabaseAdmin
      .from("token_consumptions")
      .insert({
        user_id: profile.id,
        amount: 200,
        description: `Depósito mensal de tokens - ${invoice.id}`,
        source: "stripe:invoice.paid",
        external_id: invoice.id,
      });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    logStep("ERROR", { message: err?.message });
    return new Response(JSON.stringify({ error: err?.message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
