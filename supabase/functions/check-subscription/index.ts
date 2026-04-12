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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      logStep("Auth failed", { error: userError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const user = userData.user;
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await updateProfileStatus(supabaseAdmin, user.id, 'inactive', 'trial');
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Ensure stripe_customer_id is linked in profile
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const sub = subscriptions.data[0];
      // Safely handle current_period_end - it may be a number (unix timestamp) or nested
      try {
        const rawEnd = (sub as any).current_period_end;
        if (typeof rawEnd === 'number') {
          subscriptionEnd = new Date(rawEnd * 1000).toISOString();
        }
      } catch { /* ignore date parsing errors */ }
      
      logStep("Active subscription", { subscriptionId: sub.id, end: subscriptionEnd });
      await updateProfileStatus(supabaseAdmin, user.id, 'active', 'subscriber');
    } else {
      logStep("No active subscription");
      // Don't override trial users to churned if they never subscribed
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .maybeSingle();
      const newAccountType = profile?.account_type === 'trial' ? 'trial' : 'churned';
      await updateProfileStatus(supabaseAdmin, user.id, 'inactive', newAccountType);
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
    return new Response(JSON.stringify({ subscribed: false, error: error.message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

async function updateProfileStatus(supabase: any, userId: string, status: string, accountType?: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profile) {
    const updates: any = { subscription_status: status, updated_at: new Date().toISOString() };
    if (accountType) updates.account_type = accountType;
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
  }
}
