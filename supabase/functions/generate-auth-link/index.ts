import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getDomainForContext, PLATFORM_URLS } from "../_shared/domains.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !stripeKey) {
      console.error("[GENERATE-AUTH-LINK] Missing configuration");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 500,
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[GENERATE-AUTH-LINK] JSON parse error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { email, sessionId } = body;
    if (!email || !sessionId) {
      return new Response(JSON.stringify({ error: "Email and sessionId are required" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    logStep("Request received", { email: normalizedEmail, sessionId });

    // 1. Verify the Stripe session is actually paid
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      console.error("[GENERATE-AUTH-LINK] Stripe retrieve error:", stripeError);
      return new Response(JSON.stringify({ error: "Could not verify payment session" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (stripeSession.payment_status !== "paid") {
      logStep("Payment not confirmed", { status: stripeSession.payment_status });
      return new Response(JSON.stringify({ error: "Payment not confirmed" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify email matches
    const sessionEmail = stripeSession.metadata?.customer_email || stripeSession.customer_email;
    const normalizedSessionEmail = normalizeEmail(sessionEmail || "");
    
    if (normalizedSessionEmail !== normalizedEmail) {
      logStep("Email mismatch", { sessionEmail: normalizedSessionEmail, requestEmail: normalizedEmail });
      return new Response(JSON.stringify({ error: "Email does not match payment session" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Stripe session verified", { 
      paymentStatus: stripeSession.payment_status,
      metadata: stripeSession.metadata 
    });

    // 2. Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // 3. CREDIT TOKENS
    const metadata = stripeSession.metadata || {};
    const isRecharge = metadata.is_recharge === 'true';
    const customerId = typeof stripeSession.customer === "string" 
      ? stripeSession.customer 
      : (stripeSession.customer as any)?.id;
    const customerName = metadata.customer_name || normalizedEmail.split('@')[0];

    logStep("Processing tokens", { isRecharge, customerId });

    // Check idempotency
    const creditDescription = isRecharge 
      ? `Recarga de tokens - Sessão: ${sessionId}` 
      : `Crédito inicial - Sessão: ${sessionId}`;

    const { data: existingCredit, error: creditFetchError } = await supabaseAdmin
      .from('token_consumptions')
      .select('id')
      .ilike('description', `%${sessionId}%`)
      .maybeSingle();

    if (creditFetchError) {
      console.error("[GENERATE-AUTH-LINK] Error checking idempotency:", creditFetchError.message);
    }

    if (existingCredit) {
      logStep("Tokens already credited for this session, skipping", { sessionId });
    } else {
      let userId: string;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: `Colora@${crypto.randomUUID().slice(0, 12)}`,
        email_confirm: true,
        user_metadata: { 
          full_name: customerName, 
          source: 'stripe_checkout',
          needs_password: true,
          payment_session: sessionId
        }
      });

      if (createError) {
        logStep("User already exists or creation failed, looking up", { error: createError.message });
        
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: normalizedEmail,
        });
        
        if (linkError || !linkData?.user) {
          console.error("[GENERATE-AUTH-LINK] Cannot find user:", linkError?.message);
          return new Response(JSON.stringify({ error: "Could not find user account" }), {
            headers: { ...headers, "Content-Type": "application/json" },
            status: 404,
          });
        }
        
        userId = linkData.user.id;
      } else {
        userId = newUser.user.id;
      }

      const { data: currentProfile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .maybeSingle();

      if (profileFetchError) {
        console.error("[GENERATE-AUTH-LINK] Error fetching profile:", profileFetchError.message);
      }

      const currentTokens = currentProfile?.tokens || 0;
      let newTokens: number;
      let creditAmount: number;

      if (isRecharge) {
        creditAmount = 100;
        newTokens = currentTokens + 100;
      } else {
        creditAmount = 200;
        newTokens = 200;
      }

      logStep("Crediting tokens", { userId, currentTokens, creditAmount, newTokens });

      const profileData: Record<string, any> = {
        id: userId,
        tokens: newTokens,
        subscription_status: 'active',
        account_type: 'subscriber',
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
        console.error("[GENERATE-AUTH-LINK] Profile upsert error:", profileError.message);
        throw new Error("Profile update failed");
      }

      await supabaseAdmin.from('token_consumptions').insert({
        user_id: userId,
        amount: creditAmount,
        description: creditDescription,
      });

      logStep("Tokens credited successfully", { userId, creditAmount, newTokens });
    }

    // 4. Generate magic link
    const origin = req.headers.get("origin") || getDomainForContext();
    const redirectTo = `${origin}/dashboard?payment=success`;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo }
    });

    if (error) {
      console.error("[GENERATE-AUTH-LINK] Magiclink failed, trying recovery:", error.message);
      const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: { redirectTo }
      });

      if (recoveryError) {
        console.error("[GENERATE-AUTH-LINK] Recovery link failed:", recoveryError.message);
        return new Response(JSON.stringify({ error: "Could not generate authentication link" }), {
          headers: { ...headers, "Content-Type": "application/json" },
          status: 500,
        });
      }

      const fixedLink = recoveryData.properties.action_link;
      return new Response(JSON.stringify({ authLink: fixedLink, email: normalizedEmail }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const fixedLink = data.properties.action_link;
    return new Response(JSON.stringify({ authLink: fixedLink, email: normalizedEmail }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[GENERATE-AUTH-LINK] Global Error:", error.message);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
