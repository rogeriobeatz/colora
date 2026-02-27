import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await supabaseClient
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .eq('id', user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    let hasActiveSub = false;
    let subscriptionEnd = null;

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      hasActiveSub = subscriptions.data.length > 0;

      if (hasActiveSub) {
        const subscription = subscriptions.data[0];
        const periodEnd = subscription.current_period_end;
        if (periodEnd) {
          subscriptionEnd = new Date(periodEnd * 1000).toISOString();
        }
        logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });

        await supabaseClient
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('id', user.id);
      } else {
        logStep("No active subscription");
        await supabaseClient
          .from('profiles')
          .update({ subscription_status: 'inactive' })
          .eq('id', user.id);
      }
    } catch (subError: any) {
      logStep("Error processing subscriptions", { error: subError.message });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
