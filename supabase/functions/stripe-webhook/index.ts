import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendWelcomeEmail, sendRenewalEmail } from "../_shared/email.ts";
import { supabaseRetry, circuitBreakers } from "../_shared/retry.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Error notification helper
const notifyError = async (error: string, context: any) => {
  try {
    // Log structured error for debugging
    console.error(`[STRIPE-WEBHOOK] CRITICAL ERROR: ${error}`, context);
    
    // In production, you could send this to a monitoring service
    // For now, we'll just log it with high visibility
    console.error(`[WEBHOOK-FAILURE] Payment processed but user creation failed:`, {
      error,
      context,
      timestamp: new Date().toISOString(),
      requiresManualIntervention: true
    });
  } catch (logError) {
    console.error("[STRIPE-WEBHOOK] Failed to notify error:", logError);
  }
};

// User creation helper with better error handling
const createOrUpdateUser = async (supabaseAdmin: any, session: any) => {
  const metadata = session.metadata || {};
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const email = metadata.customer_email;
  const name = metadata.customer_name;
  
  if (!email) {
    throw new Error("Missing customer_email in session metadata");
  }

  logStep("Processing user creation", { email, customerId });

  try {
    // 1. Check if user exists with retry
    const { data: userList } = await supabaseRetry(
      () => supabaseAdmin.auth.admin.listUsers(),
      'listUsers',
      { maxAttempts: 3, baseDelay: 1000 }
    );
    const existingUser = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      logStep("User already exists, updating", { userId });
      
      // Update existing user with payment metadata
      await supabaseRetry(
        () => supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { 
            ...existingUser.user_metadata,
            full_name: name, 
            source: 'stripe_checkout',
            needs_password: true,
            last_payment_session: session.id
          }
        }),
        'updateUserById',
        { maxAttempts: 3, baseDelay: 1000 }
      );
    } else {
      // 2. Create new user with secure random password
      const tempPassword = `Colora@${crypto.randomUUID().slice(0, 12)}`;
      const { data: newUser, error: createError } = await supabaseRetry(
        () => supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { 
            full_name: name, 
            source: 'stripe_checkout',
            needs_password: true,
            payment_session: session.id
          }
        }),
        'createUser',
        { maxAttempts: 3, baseDelay: 1000 }
      );

      if (createError) {
        logStep("ERROR creating user", { error: createError.message });
        throw new Error(`User creation failed: ${createError.message}`);
      }
      userId = newUser.user.id;
      logStep("New user created successfully", { userId });
    }

    // 3. Upsert profile with better error handling
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
      last_payment_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseRetry(
      () => supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' }),
      'upsertProfile',
      { maxAttempts: 3, baseDelay: 1000 }
    );

    if (profileError) {
      logStep("ERROR upserting profile", { error: profileError.message });
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    // 4. Record token credit (idempotent)
    const { data: existingCredit } = await supabaseRetry(
      () => supabaseAdmin
        .from('token_consumptions')
        .select('id')
        .eq('user_id', userId)
        .eq('description', `Crédito inicial - Sessão: ${session.id}`)
        .maybeSingle(),
      'checkExistingCredit',
      { maxAttempts: 2, baseDelay: 500 }
    );

    if (!existingCredit) {
      await supabaseRetry(
        () => supabaseAdmin.from('token_consumptions').insert({
          user_id: userId,
          amount: 200,
          description: `Crédito inicial - Sessão: ${session.id}`,
        }),
        'insertTokenCredit',
        { maxAttempts: 3, baseDelay: 1000 }
      );
      logStep("Token credit recorded", { userId, amount: 200 });
    }

    logStep("User processing completed successfully", { userId, email });
    return { userId, email, name };
    
  } catch (error) {
    logStep("CRITICAL ERROR in user processing", { error: error.message, email });
    throw error;
  }
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
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

      logStep("Processing checkout.session.completed", { sessionId: session.id, metadata: session.metadata });

      if (session.metadata?.create_user_on_success === 'true') {
        try {
          const result = await createOrUpdateUser(supabaseAdmin, session);
          logStep("Checkout processing completed successfully", result);
          
          // Send welcome email
          const emailSent = await sendWelcomeEmail({
            email: result.email,
            name: result.name || result.email.split('@')[0],
            companyName: session.metadata?.customer_company
          });
          
          if (emailSent) {
            logStep("Welcome email sent successfully", { email: result.email });
          } else {
            logStep("Welcome email failed to send", { email: result.email });
          }
          
        } catch (error: any) {
          // Critical: Payment succeeded but user creation failed
          await notifyError(error.message, {
            sessionId: session.id,
            customerId,
            metadata: session.metadata,
            paymentStatus: session.payment_status
          });
          
          // Don't throw - we don't want Stripe to retry the webhook
          // The payment was successful, we just need to handle the user creation manually
          logStep("User creation failed but payment successful - manual intervention required", { 
            sessionId: session.id,
            error: error.message 
          });
        }
      }
    }

    // Handle invoice.paid for subscription renewal
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      if (customerId) {
        logStep("Processing invoice.paid", { customerId });
        
        try {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, tokens, email")
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
                last_renewal_at: new Date().toISOString()
              })
              .eq("id", profile.id);

            logStep("Tokens renewed successfully", { customerId, newTokens, profileId: profile.id });
            
            // Send renewal notification email
            const emailSent = await sendRenewalEmail({
              email: profile.email,
              name: profile.full_name || profile.email.split('@')[0],
              tokens: newTokens
            });
            
            if (emailSent) {
              logStep("Renewal email sent successfully", { email: profile.email });
            } else {
              logStep("Renewal email failed to send", { email: profile.email });
            }
          } else {
            logStep("No profile found for customer", { customerId });
          }
        } catch (error: any) {
          await notifyError(`Invoice processing failed: ${error.message}`, {
            customerId,
            invoiceId: invoice.id,
            amount: invoice.amount_paid
          });
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
