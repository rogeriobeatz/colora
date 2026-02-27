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
    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true, ignored: event.type }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const metadata = session.metadata || {};

    logStep("checkout.session.completed received", { sessionId: session.id, metadata });

    if (metadata.create_user_on_success === 'true') {
      const email = metadata.customer_email;
      const name = metadata.customer_name;
      
      logStep("Processing guest checkout - creating user", { email });

      // 1. Verificar se o usuário já existe no Supabase Auth
      const { data: authUser, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = authUser?.users.find(u => u.email === email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        logStep("User already exists, updating existing profile", { userId });
      } else {
        // 2. Criar novo usuário se não existir
        // Gerar uma senha temporária segura que o usuário deve trocar depois
        const tempPassword = `Colora@${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true, // Auto-confirmar e-mail já que o pagamento foi feito
          user_metadata: {
            full_name: name,
            source: 'stripe_webhook_auto_create'
          }
        });

        if (createError) {
          logStep("Error creating user", { error: createError.message });
          throw createError;
        }

        userId = newUser.user.id;
        logStep("New user created successfully", { userId });

        // Opcional: Enviar e-mail de "Bem-vindo" com link para resetar senha
        await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email
        });
      }

      // 3. Atualizar Perfil com dados do checkout e ID do Stripe
      const profileUpdate = {
        id: userId,
        full_name: name,
        stripe_customer_id: customerId,
        document_type: metadata.customer_document_type || 'cpf',
        document_number: metadata.customer_document || '',
        company_name: metadata.customer_company || name,
        company_phone: metadata.customer_phone || '',
        subscription_status: 'active',
        tokens: 200, // Tokens iniciais da assinatura
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileUpdate);

      if (profileError) {
        logStep("Error updating profile", { error: profileError.message });
        throw profileError;
      }

      // 4. Registrar crédito de tokens inicial
      await supabaseAdmin
        .from('token_consumptions')
        .insert({
          user_id: userId,
          amount: 200,
          description: `Depósito inicial de assinatura - Sessão: ${session.id}`,
          source: 'stripe:checkout.session.completed',
          external_id: session.id
        });

      logStep("Guest checkout processing complete", { userId });
    }

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
