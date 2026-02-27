import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey) return jsonResponse({ error: "STRIPE_SECRET_KEY is not set" }, 500);
  if (!webhookSecret) return jsonResponse({ error: "STRIPE_WEBHOOK_SECRET is not set" }, 500);

  const stripeSignature = req.headers.get("stripe-signature");
  if (!stripeSignature) return jsonResponse({ error: "Missing stripe-signature" }, 400);

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  let event: Stripe.Event;
  let rawBody: string;

  try {
    rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
  } catch (err: any) {
    logStep("Signature verification failed", { message: err?.message });
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    if (event.type !== "invoice.paid") {
      return jsonResponse({ received: true, ignored: event.type });
    }

    const invoice = event.data.object as Stripe.Invoice;

    const invoiceId = invoice.id;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    logStep("invoice.paid received", {
      invoiceId,
      customerId,
      billing_reason: invoice.billing_reason,
      subscription: invoice.subscription,
    });

    if (!invoiceId || !customerId) {
      return jsonResponse({ error: "Missing invoice.id or invoice.customer" }, 400);
    }

    // Só credita tokens em cobranças recorrentes (ciclo) ou criação de assinatura.
    // Evita creditar em invoices não relacionadas ao ciclo.
    if (invoice.billing_reason && !["subscription_cycle", "subscription_create"].includes(invoice.billing_reason)) {
      logStep("Ignored invoice due to billing_reason", { billing_reason: invoice.billing_reason });
      return jsonResponse({ received: true, ignored: "billing_reason" });
    }

    // Idempotência por invoice.id
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("token_consumptions")
      .select("id")
      .eq("source", "stripe:invoice.paid")
      .eq("external_id", invoiceId)
      .limit(1);

    if (existingError) {
      logStep("Error checking idempotency", { message: existingError.message });
      return jsonResponse({ error: "Failed to verify idempotency" }, 500);
    }

    if (existing && existing.length > 0) {
      logStep("Duplicate invoice ignored", { invoiceId });
      return jsonResponse({ received: true, duplicate: true });
    }

    // Localizar perfil pelo stripe_customer_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, tokens, tokens_expires_at")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profileError || !profile) {
      logStep("Profile not found for customer", { customerId, error: profileError?.message });
      return jsonResponse({ error: "Profile not found for Stripe customer" }, 404);
    }

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);

    const currentExpiresAt = profile.tokens_expires_at ? new Date(profile.tokens_expires_at) : null;
    const finalExpiresAt = !currentExpiresAt || currentExpiresAt < newExpiresAt ? newExpiresAt : currentExpiresAt;

    const newTokens = (profile.tokens || 0) + 200;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        tokens: newTokens,
        tokens_expires_at: finalExpiresAt.toISOString(),
        last_token_deposit: now.toISOString().slice(0, 10),
        subscription_status: "active",
      })
      .eq("id", profile.id);

    if (updateError) {
      logStep("Failed to update tokens", { message: updateError.message });
      return jsonResponse({ error: "Failed to update tokens" }, 500);
    }

    const { error: insertError } = await supabaseAdmin
      .from("token_consumptions")
      .insert({
        user_id: profile.id,
        amount: 200,
        description: `Depósito mensal de tokens - ${invoiceId}`,
        source: "stripe:invoice.paid",
        external_id: invoiceId,
      });

    if (insertError) {
      logStep("Failed to insert ledger entry", { message: insertError.message });
      return jsonResponse({ error: "Failed to record token credit" }, 500);
    }

    logStep("Tokens credited", { userId: profile.id, invoiceId, newTokens, expiresAt: finalExpiresAt.toISOString() });

    return jsonResponse({ received: true });
  } catch (err: any) {
    logStep("ERROR", { message: err?.message, stack: err?.stack });
    return jsonResponse({ error: err?.message || "Internal error" }, 500);
  }
});
