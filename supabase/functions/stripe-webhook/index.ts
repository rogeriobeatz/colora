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
    logStep("ERROR: Stripe keys not configured in Supabase environment");
    return new Response(JSON.stringify({ error: "Stripe keys not configured" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripeSignature = req.headers.get("Stripe-Signature");
  if (!stripeSignature) {
    logStep("ERROR: Missing stripe-signature header");
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
    logStep("Event verified successfully", { type: event.type });
  } catch (err: any) {
    logStep("ERROR: Signature verification failed", { message: err?.message });
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
    // Escutar por checkout.session.completed para criação de conta
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

      logStep("Processing checkout.session.completed", { sessionId: session.id, metadata });

      if (metadata.create_user_on_success === 'true') {
        const email = metadata.customer_email;
        const name = metadata.customer_name;
        
        if (!email) {
          logStep("ERROR: Missing customer_email in session metadata");
          throw new Error("Missing customer_email in session metadata");
        }

        logStep("Attempting to create/update user", { email });

        // 1. Verificar se o usuário já existe
        const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          logStep("ERROR listing users", { error: listError.message });
          throw listError;
        }

        const existingUser = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          logStep("User already exists, updating profile", { userId });
        } else {
          // 2. Criar novo usuário
          const tempPassword = `Colora@${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: name,
              source: 'stripe_webhook_auto_create'
            }
          });

          if (createError) {
            logStep("ERROR creating user in Auth", { error: createError.message });
            throw createError;
          }

          userId = newUser.user.id;
          logStep("New user created successfully in Auth", { userId });
        }

        // 3. Criar/Atualizar Perfil (upsert)
        const profileUpdate = {
          id: userId,
          full_name: name,
          stripe_customer_id: customerId,
          document_type: metadata.customer_document_type || 'cpf',
          document_number: metadata.customer_document || '',
          company_name: metadata.customer_company || name,
          company_phone: metadata.customer_phone || '',
          subscription_status: 'active',
          tokens: 200,
          updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert(profileUpdate, { onConflict: 'id' });

        if (profileError) {
          logStep("ERROR upserting profile", { error: profileError.message });
          throw profileError;
        }

        logStep("Profile updated successfully", { userId });

        // 4. Registrar crédito de tokens
        const { error: tokenError } = await supabaseAdmin
          .from('token_consumptions')
          .insert({
            user_id: userId,
            amount: 200,
            description: `Depósito inicial de assinatura - Sessão: ${session.id}`,
            source: 'stripe:checkout.session.completed',
            external_id: session.id
          });

        if (tokenError) {
          logStep("WARNING: Failed to record token credit (but user/profile created)", { error: tokenError.message });
        }

        logStep("Guest checkout processing complete", { userId });
      }
    }

    // Escutar por customer.subscription.created para atualizar dados após pagamento
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing customer.subscription.created", { subscriptionId: subscription.id });
      // Aqui podemos fazer qualquer processamento adicional se necessário
    }

    // Escutar por invoice.paid para renovação de assinatura
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      if (customerId) {
        logStep("Processing invoice.paid", { invoiceId: invoice.id, customerId });
        
        // Localizar perfil pelo stripe_customer_id
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, tokens")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const newTokens = (profile.tokens || 0) + 200;
          await supabaseAdmin
            .from("profiles")
            .update({
              tokens: newTokens,
              subscription_status: "active",
              updated_at: new Date().toISOString()
            })
            .eq("id", profile.id);

          logStep("Tokens renewed for customer", { customerId, newTokens });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    logStep("CRITICAL ERROR in Webhook", { message: err?.message, stack: err?.stack });
    return new Response(JSON.stringify({ error: err?.message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
