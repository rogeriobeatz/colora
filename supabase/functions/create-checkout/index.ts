import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Client for user auth verification
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Service role client for profile updates (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error", { message: userError.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = data.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { mode, customerData } = await req.json();
    logStep("Request received", { mode, customerData: !!customerData });

    // Salvar dados do checkout no perfil ANTES de criar sessão Stripe
    if (customerData) {
      logStep("Saving customer data to profile");
      
      const profileUpdate: any = {
        full_name: customerData.name || null,
        document_type: customerData.document_type || 'cpf',
        document_number: customerData.document || null,
        company_address: customerData.company || null,
        company_phone: customerData.phone || null,
        updated_at: new Date().toISOString(),
      };

      // Se não tem company_name, usar o nome do usuário
      if (!user.user_metadata?.company_name) {
        profileUpdate.company_name = customerData.company || customerData.name || "Minha Loja";
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      if (profileError) {
        logStep("Error updating profile", { error: profileError.message });
        throw new Error(`Erro ao salvar dados: ${profileError.message}`);
      }
      
      logStep("Profile updated successfully");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Buscar ou criar cliente Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });

      // Garantir que o stripe_customer_id esteja persistido no perfil
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    } else {
      // Criar novo cliente com dados do checkout
      const customerParams: any = {
        email: user.email,
        name: customerData?.name || user.user_metadata?.name || user.email,
        metadata: {
          user_id: user.id,
          source: 'colora_checkout',
        },
      };

      if (customerData?.phone) {
        customerParams.phone = customerData.phone;
      }

      if (customerData?.company) {
        customerParams.description = `Empresa: ${customerData.company}`;
      }

      const newCustomer = await stripe.customers.create(customerParams);
      customerId = newCustomer.id;
      
      // Salvar stripe_customer_id no perfil
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      logStep("Created new Stripe customer", { customerId });
    }

    // Subscription: R$59,90/mês
    // Token recharge: R$29,90 one-off (100 tokens)
    const isSubscription = mode === "subscription";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: isSubscription
            ? "price_1T458zRjNIKJreFo2hsTiIKO"
            : "price_1T459DRjNIKJreFoNCmabUQM",
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}/dashboard?payment=success&type=${mode}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?payment=canceled`,
      metadata: {
        user_id: user.id,
        type: mode,
        customer_name: customerData?.name || '',
        customer_company: customerData?.company || '',
        customer_document: customerData?.document || '',
      },
      customer_update: {
        name: "auto",
        address: "auto",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
