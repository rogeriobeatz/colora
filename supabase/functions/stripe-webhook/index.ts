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
    logStep("ERROR: Stripe keys not configured");
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
    logStep("Event verified", { type: event.type });
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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

      logStep("Processing checkout.session.completed", { sessionId: session.id, metadata });

      if (metadata.create_user_on_success === 'true') {
        const email = metadata.customer_email;
        const name = metadata.customer_name;
        
        if (!email) {
          throw new Error("Missing customer_email in session metadata");
        }

        logStep("Processing guest checkout", { email });

        // 1. Check if user exists
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          logStep("User already exists", { userId });
          // Mark needs_password if they were created via checkout before
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { 
              ...existingUser.user_metadata,
              full_name: name, 
              source: 'stripe_checkout',
              needs_password: true 
            }
          });
        } else {
          // 2. Create new user with a secure random password (user will set their own later)
          const tempPassword = `Colora@${crypto.randomUUID().slice(0, 12)}`;
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { 
              full_name: name, 
              source: 'stripe_checkout',
              needs_password: true
            }
          });

          if (createError) {
            logStep("ERROR creating user", { error: createError.message });
            throw createError;
          }
          userId = newUser.user.id;
          logStep("User created", { userId });
        }

        // 3. Upsert profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
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
          }, { onConflict: 'id' });

        if (profileError) {
          logStep("ERROR upserting profile", { error: profileError.message });
          throw profileError;
        }

        // 4. Record token credit (idempotent)
        const { data: existingCredit } = await supabaseAdmin
          .from('token_consumptions')
          .select('id')
          .eq('user_id', userId)
          .eq('description', `Crédito inicial - Sessão: ${session.id}`)
          .maybeSingle();

        if (!existingCredit) {
          await supabaseAdmin.from('token_consumptions').insert({
            user_id: userId,
            amount: 200,
            description: `Crédito inicial - Sessão: ${session.id}`,
          });
        }

        logStep("Checkout processing complete (no email sent, user will auto-login)", { userId, email });
      }
    }

    // Handle invoice.paid for subscription renewal
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      if (customerId) {
        logStep("Processing invoice.paid", { customerId });
        
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

          logStep("Tokens renewed", { customerId, newTokens });
        }
      }
    }

    // Handle subscription deleted/canceled
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

      if (customerId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "inactive", updated_at: new Date().toISOString() })
            .eq("id", profile.id);
          logStep("Subscription canceled", { customerId });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    logStep("CRITICAL ERROR", { message: err?.message });
    return new Response(JSON.stringify({ error: err?.message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
