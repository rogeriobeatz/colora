import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-AUTH-LINK] ${step}${detailsStr}`);
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { email, sessionId } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    
    logStep("Request received", { email: normalizedEmail, sessionId });

    if (!email || !sessionId) {
      throw new Error("Email e sessionId são obrigatórios");
    }

    // 1. Verify the Stripe session is actually paid
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (stripeSession.payment_status !== "paid") {
      logStep("Payment not confirmed", { status: stripeSession.payment_status });
      throw new Error("Pagamento não confirmado");
    }

    // Verify email matches
    const sessionEmail = stripeSession.metadata?.customer_email || stripeSession.customer_email;
    const normalizedSessionEmail = normalizeEmail(sessionEmail || "");
    
    if (normalizedSessionEmail !== normalizedEmail) {
      logStep("Email mismatch", { sessionEmail: normalizedSessionEmail, requestEmail: normalizedEmail });
      throw new Error("Email não corresponde à sessão de pagamento");
    }

    logStep("Stripe session verified", { 
      paymentStatus: stripeSession.payment_status,
      metadata: stripeSession.metadata 
    });

    // 2. Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // 3. CREDIT TOKENS - Main logic moved from webhook
    const metadata = stripeSession.metadata || {};
    const isRecharge = metadata.is_recharge === 'true';
    const isNewSubscription = metadata.create_user_on_success === 'true';
    const customerId = typeof stripeSession.customer === "string" 
      ? stripeSession.customer 
      : (stripeSession.customer as any)?.id;
    const customerName = metadata.customer_name || normalizedEmail.split('@')[0];

    logStep("Processing tokens", { isRecharge, isNewSubscription, customerId });

    // Check idempotency - was this session already credited?
    const creditDescription = isRecharge 
      ? `Recarga de tokens - Sessão: ${sessionId}` 
      : `Crédito inicial - Sessão: ${sessionId}`;

    const { data: existingCredit } = await supabaseAdmin
      .from('token_consumptions')
      .select('id')
      .ilike('description', `%${sessionId}%`)
      .maybeSingle();

    if (existingCredit) {
      logStep("Tokens already credited for this session, skipping", { sessionId });
    } else {
      // Find or create user
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users.find(
        (u: any) => u.email?.toLowerCase() === normalizedEmail
      );
      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        logStep("Existing user found", { userId });
      } else {
        // Create new user
        const tempPassword = `Colora@${crypto.randomUUID().slice(0, 12)}`;
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { 
            full_name: customerName, 
            source: 'stripe_checkout',
            needs_password: true,
            payment_session: sessionId
          }
        });

        if (createError) {
          throw new Error(`User creation failed: ${createError.message}`);
        }
        userId = newUser.user.id;
        logStep("New user created", { userId });
      }

      // Get current profile to determine token amount
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .maybeSingle();

      const currentTokens = currentProfile?.tokens || 0;
      let newTokens: number;
      let creditAmount: number;

      if (isRecharge) {
        creditAmount = 100;
        newTokens = currentTokens + 100;
      } else {
        // New subscription: set to 200 (not additive)
        creditAmount = 200;
        newTokens = 200;
      }

      logStep("Crediting tokens", { userId, currentTokens, creditAmount, newTokens });

      // Upsert profile
      const profileData: Record<string, any> = {
        id: userId,
        tokens: newTokens,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (customerId) profileData.stripe_customer_id = customerId;
      if (!isRecharge) {
        profileData.full_name = customerName;
        profileData.document_type = metadata.customer_document_type || 'cpf';
        profileData.document_number = metadata.customer_document || '';
        profileData.company_name = metadata.customer_company || customerName;
        profileData.company_phone = metadata.customer_phone || '';
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        logStep("Profile upsert error", { error: profileError.message });
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      // Record token credit
      await supabaseAdmin.from('token_consumptions').insert({
        user_id: userId,
        amount: creditAmount,
        description: creditDescription,
      });

      logStep("Tokens credited successfully", { userId, creditAmount, newTokens });
    }

    // 4. Generate magic link
    const origin = req.headers.get("origin") || "https://colora.rogerio.work";
    const redirectTo = `${origin}/dashboard?payment=success`;

    const fixActionLink = (actionLink: string): string => {
      try {
        const url = new URL(actionLink);
        url.searchParams.set("redirect_to", redirectTo);
        return url.toString();
      } catch {
        return actionLink;
      }
    };

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo }
    });

    if (error) {
      logStep("Magiclink failed, trying recovery", { error: error.message });
      const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: { redirectTo }
      });

      if (recoveryError) throw recoveryError;

      const fixedLink = fixActionLink(recoveryData.properties.action_link);
      logStep("Recovery link generated", { fixedLink });
      return new Response(JSON.stringify({ authLink: fixedLink, email: normalizedEmail }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const fixedLink = fixActionLink(data.properties.action_link);
    logStep("Auth link generated successfully", { email: normalizedEmail, fixedLink });

    return new Response(JSON.stringify({ authLink: fixedLink, email: normalizedEmail }), {
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
