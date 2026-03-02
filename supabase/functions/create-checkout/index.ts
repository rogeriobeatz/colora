import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  try {
    const { mode, customerData } = await req.json();
    const origin = req.headers.get("origin") || "https://colora.rogerio.work";
    logStep("Request received", { mode, email: customerData?.email });

    if (!customerData?.email || !customerData?.name) {
      throw new Error("Dados do cliente incompletos (e-mail e nome são obrigatórios)");
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: customerData.email, limit: 1 });
    let customerId: string | undefined;
    
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
    
    // Success URL → simple success page with email param
    const successUrl = `${origin}/checkout/sucesso?email=${encodeURIComponent(customerData.email)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?payment=canceled`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: isSubscription
            ? "price_1T458zRjNIKJreFo2hsTiIKO"
            : "price_1T459DRjNIKJreFoNCmabUQM",
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
        create_user_on_success: 'true',
        origin: origin,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
