import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getDomainForContext, PLATFORM_URLS } from "../_shared/domains.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[CREATE-CHECKOUT] STRIPE_SECRET_KEY not configured");
    return new Response(JSON.stringify({ error: "Service configuration error" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil",
  });

  try {
    let parsedBody;
    try {
      parsedBody = await req.json();
    } catch (parseError) {
      console.error("[CREATE-CHECKOUT] JSON parse error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { mode, customerData } = parsedBody;
    const origin = req.headers.get("origin") || getDomainForContext();

    if (!customerData?.email || !customerData?.name) {
      return new Response(JSON.stringify({ error: "Customer email and name are required" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (mode !== "subscription" && mode !== "payment") {
      return new Response(JSON.stringify({ error: "Invalid checkout mode" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Processing checkout", { 
      mode, 
      email: customerData.email
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: customerData.email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customerParams: any = {
        email: customerData.email,
        name: customerData.name,
        metadata: { source: 'colora_checkout' },
      };
      if (customerData.phone) customerParams.phone = customerData.phone;
      
      const newCustomer = await stripe.customers.create(customerParams);
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    const isSubscription = mode === "subscription";
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
    const baseUrl = isLocalhost ? origin : getDomainForContext();
    
    const successUrl = `${baseUrl}/checkout/sucesso?email=${encodeURIComponent(customerData.email)}&session_id={CHECKOUT_SESSION_ID}&mode=${mode}&origin=${encodeURIComponent(origin || baseUrl)}`;
    const cancelUrl = `${baseUrl}/checkout?payment=canceled`;

    const subscriptionPrice = isSubscription ? "price_1TMJyxDjnFXv6Lea0fS0peL1" : null;
    const rechargePrice = !isSubscription ? "price_1TMJz5DjnFXv6LeaLN6eugl2" : null;
    const priceId = subscriptionPrice || rechargePrice;

    if (!priceId) {
      console.error("[CREATE-CHECKOUT] Price ID not configured for mode:", mode);
      return new Response(JSON.stringify({ error: "Pricing configuration error" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: mode,
        customer_email: customerData.email,
        customer_name: customerData.name,
        customer_phone: customerData.phone || '',
        customer_company: customerData.company || '',
        customer_document: customerData.document || '',
        customer_document_type: customerData.documentType || 'cpf',
        create_user_on_success: isSubscription ? 'true' : 'false',
        is_recharge: !isSubscription ? 'true' : 'false',
        origin: origin,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[CREATE-CHECKOUT] Global Error:", error.message);
    return new Response(JSON.stringify({ error: "An error occurred while creating the checkout session" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
