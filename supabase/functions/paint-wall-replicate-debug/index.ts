import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  console.log("[DEBUG] Function started");
  
  if (req.method === "OPTIONS") {
    console.log("[DEBUG] OPTIONS request");
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    console.log("[DEBUG] Checking environment variables...");
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[DEBUG] ENV check:", { 
      hasReplicateKey: !!REPLICATE_API_KEY, 
      hasSupabaseUrl: !!SUPABASE_URL, 
      hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY 
    });

    if (!REPLICATE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[DEBUG] Missing ENV vars");
      return new Response(JSON.stringify({ error: "Variáveis ausentes", debug: "ENV missing" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type"
        }
      });
    }

    console.log("[DEBUG] Creating Supabase client...");
    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("[DEBUG] Checking auth header...");
    const authHeader = req.headers.get("Authorization");
    console.log("[DEBUG] Auth header presente:", !!authHeader);
    
    if (!authHeader) {
      console.error("[DEBUG] Authorization header ausente");
      return new Response(JSON.stringify({ error: "Não autorizado", debug: "No auth header" }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type"
        }
      });
    }

    console.log("[DEBUG] Extracting token...");
    const token = authHeader.replace("Bearer ", "");
    console.log("[DEBUG] Token extracted:", token.substring(0, 30) + "...");
    
    console.log("[DEBUG] Validating user...");
    const { data: { user }, error: authError } = await serviceRoleClient.auth.getUser(token);
    if (authError || !user) {
      console.error("[DEBUG] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Sessão expirada", debug: "Auth failed", details: authError }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type"
        }
      });
    }
    console.log("[DEBUG] User authenticated:", user.id);

    console.log("[DEBUG] Parsing request body...");
    const body = await req.json().catch(() => ({}));
    const { imageUrl, imageBase64, paintColor, wallLabel, wallLabelEn, aspectMode } = body;
    console.log("[DEBUG] Body parsed:", { paintColor, hasImageBase64: !!imageBase64, hasImageUrl: !!imageUrl });

    if (!paintColor) {
      console.error("[DEBUG] Paint color missing");
      return new Response(JSON.stringify({ error: "Cor não fornecida", debug: "No paint color" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type"
        }
      });
    }

    console.log("[DEBUG] Checking user tokens...");
    const { data: profile } = await serviceRoleClient.from('profiles').select('tokens').eq('id', user.id).single();
    if (!profile || profile.tokens <= 0) {
      console.error("[DEBUG] Insufficient tokens:", profile?.tokens);
      return new Response(JSON.stringify({ error: "Tokens insuficientes", debug: "No tokens", tokens: profile?.tokens }), {
        status: 403,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type"
        }
      });
    }
    console.log("[DEBUG] Tokens available:", profile.tokens);

    console.log("[DEBUG] Preparing image...");
    let publicUrl = imageUrl;
    
    if (imageBase64) {
      console.log("[DEBUG] Processing base64 image...");
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        const fileName = `${user.id}/rep_${Date.now()}.png`;
        
        // Decode base64 manualmente
        const binary = atob(cleanBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        console.log("[DEBUG] Uploading to Supabase storage...");
        await serviceRoleClient.storage.from('images').upload(fileName, bytes, { contentType: 'image/png' });
        
        console.log("[DEBUG] Creating signed URL...");
        const { data: signedData } = await serviceRoleClient.storage.from('images').createSignedUrl(fileName, 3600);
        publicUrl = signedData?.signedUrl;
        console.log("[DEBUG] Image uploaded, URL:", publicUrl?.substring(0, 50) + "...");
      } catch (error) {
        console.error("[DEBUG] Error processing base64:", error);
        return new Response(JSON.stringify({ error: "Erro ao processar imagem", debug: "Base64 processing failed", details: error.message }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization, content-type"
          }
        });
      }
    } else if (imageUrl && imageUrl.includes("supabase.co")) {
      console.log("[DEBUG] Processing Supabase image URL...");
      const path = imageUrl.split('/storage/v1/object/public/images/')[1] || imageUrl.split('/storage/v1/object/authenticated/images/')[1];
      if (path) {
        const { data: signedData } = await serviceRoleClient.storage.from('images').createSignedUrl(decodeURIComponent(path), 3600);
        publicUrl = signedData?.signedUrl || publicUrl;
      }
      console.log("[DEBUG] Supabase URL processed:", publicUrl?.substring(0, 50) + "...");
    }

    if (!publicUrl) {
      console.error("[DEBUG] No public URL generated");
      return new Response(JSON.stringify({ error: "Imagem não preparada", debug: "No URL generated" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type"
        }
      });
    }

    console.log("[DEBUG] All checks passed! Ready to call Replicate...");
    console.log("[DEBUG] Final URL:", publicUrl.substring(0, 50) + "...");
    console.log("[DEBUG] Paint color:", paintColor);
    
    return new Response(JSON.stringify({ 
      success: true, 
      debug: "All checks passed",
      imageUrl: publicUrl.substring(0, 50) + "...",
      paintColor,
      userId: user.id,
      tokensRemaining: profile.tokens
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type"
      }
    });

  } catch (err: any) {
    console.error("[DEBUG] Global error:", err);
    console.error("[DEBUG] Error stack:", err.stack);
    return new Response(JSON.stringify({ 
      error: "Erro interno", 
      debug: "Global error",
      details: err.message,
      stack: err.stack 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type"
      }
    });
  }
});
