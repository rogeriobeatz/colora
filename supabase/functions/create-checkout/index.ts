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

  // 🔍 DEBUG: Log completo da requisição
  const origin = req.headers.get("origin");
  logStep("=== REQUEST DEBUG ===", {
    method: req.method,
    url: req.url,
    origin: origin,
    headers: {
      origin: origin,
      contentType: req.headers.get("content-type"),
      authorization: req.headers.get("authorization") ? "***" : "missing",
      userAgent: req.headers.get("user-agent")
    }
  });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  logStep("ENV CHECK", {
    hasStripeKey: !!stripeKey,
    hasWebhookSecret: !!webhookSecret,
    stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 10) + "..." : "null"
  });
  
  if (!stripeKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not configured");
    return new Response(JSON.stringify({ error: "Stripe configuration missing" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil",
  });

  try {
    // 🔍 DEBUG: Log do body parsing
    const bodyText = await req.text();
    logStep("RAW BODY", { bodyText, bodyLength: bodyText.length });
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (parseError) {
      logStep("JSON PARSE ERROR", { error: parseError.message, rawBody: bodyText });
      throw new Error("Invalid JSON in request body");
    }
    
    const { mode, customerData } = parsedBody;
    const origin = req.headers.get("origin") || "https://colora.rogerio.work";
    
    logStep("PARSED DATA", { 
      mode, 
      customerData,
      hasEmail: !!customerData?.email,
      hasName: !!customerData?.name,
      origin
    });

    if (!customerData?.email || !customerData?.name) {
      throw new Error("Dados do cliente incompletos (e-mail e nome são obrigatórios)");
    }

    // Find or create Stripe customer
    logStep("FINDING CUSTOMER", { email: customerData.email });
    const customers = await stripe.customers.list({ email: customerData.email, limit: 1 });
    let customerId: string | undefined;
    
    logStep("CUSTOMER SEARCH RESULT", { 
      found: customers.data.length > 0,
      customerCount: customers.data.length
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("CREATING NEW CUSTOMER", { email: customerData.email, name: customerData.name });
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
    
    // 🔧 CORREÇÃO: Success URL dinâmica baseada no frontend
    // Detecta se está em localhost ou produção
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
    const baseUrl = isLocalhost ? origin : "https://colora.rogerio.work";
    
    // Success URL → página de sucesso com redirecionamento dinâmico
    const successUrl = `${baseUrl}/checkout/sucesso?email=${encodeURIComponent(customerData.email)}&session_id={CHECKOUT_SESSION_ID}&mode=${mode}&origin=${encodeURIComponent(origin || baseUrl)}`;
    const cancelUrl = `${baseUrl}/checkout?payment=canceled`;
    
    logStep("URL CONFIG", {
      origin,
      isLocalhost,
      baseUrl,
      successUrl,
      cancelUrl
    });

    // Verificar se os preços existem antes de criar sessão
    const subscriptionPrice = isSubscription ? "price_1T458zRjNIKJreFo2hsTiIKO" : null;
    const rechargePrice = !isSubscription ? "price_1T459DRjNIKJreFoNCmabUQM" : null;
    
    logStep("PRICE CHECK", {
      isSubscription,
      subscriptionPrice,
      rechargePrice,
      finalPrice: subscriptionPrice || rechargePrice
    });
    
    if (!subscriptionPrice && !rechargePrice) {
      throw new Error("Preço não configurado para o modo selecionado");
    }

    logStep("CREATING CHECKOUT SESSION", {
      customerId,
      price: subscriptionPrice || rechargePrice,
      mode: isSubscription ? "subscription" : "payment",
      successUrl,
      cancelUrl
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: subscriptionPrice || rechargePrice,
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
        create_user_on_success: isSubscription ? 'true' : 'false', // 🔧 CORREÇÃO: Só para assinaturas
        is_recharge: !isSubscription ? 'true' : 'false', // ✅ Identificar recargas
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
