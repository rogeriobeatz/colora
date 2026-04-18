import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("[CUSTOMER-PORTAL] Missing configuration");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      if (userError) console.error("[CUSTOMER-PORTAL] Auth error:", userError.message);
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      console.error("[CUSTOMER-PORTAL] No Stripe customer found for:", user.email);
      return new Response(JSON.stringify({ error: "Customer profile not found" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const origin = req.headers.get("origin") || "https://colora.app"; // Fallback to production
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/dashboard`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[CUSTOMER-PORTAL] Global Error:", error.message);
    return new Response(JSON.stringify({ error: "An error occurred while opening the customer portal" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
