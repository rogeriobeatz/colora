import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Token recharge handler for existing users
const handleTokenRecharge = async (supabaseAdmin: ReturnType<typeof createClient>, session: any) => {
  const metadata = session.metadata || {};
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const email = metadata.customer_email;
  
  logStep("Processing token recharge", { email, customerId, sessionId: session.id });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, tokens, full_name")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    throw new Error(`Profile not found for customer: ${customerId}`);
  }

  logStep("Found profile for recharge", { profileId: profile.id, currentTokens: profile.tokens });

  const newTokens = (profile.tokens || 0) + 100;
  
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      tokens: newTokens,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    throw new Error(`Failed to update tokens: ${error.message}`);
  }

  await supabaseAdmin.from("token_consumptions").insert({
    user_id: profile.id,
    amount: 100,
    description: `Recarga de tokens - Sessão: ${session.id}`,
  });

  logStep("Tokens recharged successfully", { profileId: profile.id, oldTokens: profile.tokens, newTokens });
  return { userId: profile.id, newTokens };
};

// User creation helper
const createOrUpdateUser = async (supabaseAdmin: ReturnType<typeof createClient>, session: any) => {
  const metadata = session.metadata || {};
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const email = metadata.customer_email;
  const name = metadata.customer_name;
  
  if (!email) {
    throw new Error("Missing customer_email in session metadata");
  }

  logStep("Processing user creation", { email, customerId });

  // 1. Check if user exists
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = userList?.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    logStep("User already exists, updating", { userId });

    // Update existing user metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { 
        ...existingUser.user_metadata,
        full_name: name, 
        source: 'stripe_checkout',
        needs_password: true,
        last_payment_session: session.id
      }
    });
  } else {
    // 2. Create new user with secure random password
    const tempPassword = `Colora@${crypto.randomUUID().slice(0, 12)}`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        full_name: name, 
        source: 'stripe_checkout',
        needs_password: true,
        payment_session: session.id
      }
    });

    if (createError) {
      throw new Error(`User creation failed: ${createError.message}`);
    }
    userId = newUser.user.id;
    logStep("New user created successfully", { userId });
  }

  // 3. Upsert profile
  const profileData = {
    id: userId,
    full_name: name || email.split('@')[0],
    stripe_customer_id: customerId,
    document_type: metadata.customer_document_type || 'cpf',
    document_number: metadata.customer_document || '',
    company_name: metadata.customer_company || name || email.split('@')[0],
    company_phone: metadata.customer_phone || '',
    subscription_status: 'active',
    tokens: 200,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Profile creation failed: ${profileError.message}`);
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
    logStep("Token credit recorded", { userId, amount: 200 });
  }

  logStep("User processing completed successfully", { userId, email });
  return { userId, email, name };
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
    logStep("Event verified", { type: event.type, id: event.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR: Signature verification failed", { message });
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

      logStep("Processing checkout.session.completed", { 
        sessionId: session.id, 
        metadata: session.metadata,
        isRecharge: session.metadata?.is_recharge === 'true'
      });

      if (session.metadata?.is_recharge === 'true') {
        await handleTokenRecharge(supabaseAdmin, session);
        logStep("Token recharge completed successfully");
      } else if (session.metadata?.create_user_on_success === 'true') {
        const result = await createOrUpdateUser(supabaseAdmin, session);
        logStep("Checkout processing completed successfully", result);
      } else {
        logStep("Session completed but no action needed", { sessionId: session.id });
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
          .select("id, tokens, email, full_name")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const newTokens = (profile.tokens || 0) + 200;
          await supabaseAdmin
            .from("profiles")
            .update({
              tokens: newTokens,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          logStep("Tokens renewed successfully", { customerId, newTokens, profileId: profile.id });
        } else {
          logStep("No profile found for customer", { customerId });
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("CRITICAL ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
