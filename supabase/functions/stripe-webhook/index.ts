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
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  const stripe = new Stripe(stripeKey!, { apiVersion: "2025-08-27.basil" });
  const sig = req.headers.get("Stripe-Signature");

  try {
    const event = stripe.webhooks.constructEvent(await req.text(), sig!, webhookSecret!);
    logStep("Event Received", { type: event.type });

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const invoiceId = invoice.id;

      // STRICT IDEMPOTENCY CHECK
      const { data: existing } = await supabaseAdmin
        .from("token_consumptions")
        .select("id")
        .eq("external_id", invoiceId)
        .maybeSingle();

      if (existing) {
        logStep("Duplicate Event Ignored", { invoiceId });
        return new Response(JSON.stringify({ received: true, duplicate: true }), { headers, status: 200 });
      }

      const { data: profile } = await supabaseAdmin.from("profiles").select("id, tokens").eq("stripe_customer_id", customerId).single();

      if (profile) {
        const amount = 200; // Valor padrão da assinatura
        await supabaseAdmin.from("profiles").update({ 
          tokens: (profile.tokens || 0) + amount,
          subscription_status: "active",
          account_type: "subscriber"
        }).eq("id", profile.id);

        await supabaseAdmin.from("token_consumptions").insert({
          user_id: profile.id,
          amount,
          description: `Assinatura: ${invoiceId}`,
          external_id: invoiceId,
          source: 'stripe_invoice'
        });
        
        logStep("Tokens Credited", { profileId: profile.id, amount });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from("profiles").update({ subscription_status: "inactive", account_type: "churned" }).eq("stripe_customer_id", sub.customer as string);
      logStep("Subscription Terminated", { customer: sub.customer });
    }

    return new Response(JSON.stringify({ received: true }), { headers, status: 200 });
  } catch (err: any) {
    logStep("Critical Error", { error: err.message });
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 400 });
  }
});
