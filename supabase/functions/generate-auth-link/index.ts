import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-AUTH-LINK] ${step}${detailsStr}`);
};

// Helper function to normalize email for consistent comparison
const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

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

    // Verify email matches with normalized comparison
    const sessionEmail = stripeSession.metadata?.customer_email || stripeSession.customer_email;
    const normalizedSessionEmail = normalizeEmail(sessionEmail || "");
    
    if (normalizedSessionEmail !== normalizedEmail) {
      logStep("Email mismatch", { 
        sessionEmail: normalizedSessionEmail, 
        requestEmail: normalizedEmail,
        originalSessionEmail: sessionEmail,
        originalRequestEmail: email
      });
      throw new Error("Email não corresponde à sessão de pagamento");
    }

    logStep("Stripe session verified", { paymentStatus: stripeSession.payment_status });

    // 2. Generate a magic link (programmatic, no email sent)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const origin = req.headers.get("origin") || "https://colora.rogerio.work";
    const redirectTo = `${origin}/dashboard?payment=success`;

    // Helper: fix the action_link to use the correct redirect_to (Supabase defaults to Site URL which may be localhost)
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
      email: email,
      options: {
        redirectTo
      }
    });

    if (error) {
      logStep("ERROR generating link", { error: error.message });
      // Fallback: try recovery link
      const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo
        }
      });

      if (recoveryError) throw recoveryError;

      const fixedLink = fixActionLink(recoveryData.properties.action_link);
      logStep("Recovery link generated as fallback", { fixedLink });
      return new Response(JSON.stringify({ 
        authLink: fixedLink,
        email 
      }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const fixedLink = fixActionLink(data.properties.action_link);
    logStep("Auth link generated successfully", { email, fixedLink });

    return new Response(JSON.stringify({ 
      authLink: fixedLink,
      email 
    }), {
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
