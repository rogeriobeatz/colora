import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  console.log("[paint-wall-replicate-simple] Request recebido");
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[paint-wall-replicate-simple] ENV vars:", { 
      hasReplicateKey: !!REPLICATE_API_KEY, 
      hasSupabaseUrl: !!SUPABASE_URL, 
      hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY 
    });

    if (!REPLICATE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Variáveis ausentes" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Teste simples da API Replicate
    const testResponse = await fetch("https://api.replicate.com/v1/account", {
      headers: { "Authorization": `Token ${REPLICATE_API_KEY}` }
    });

    if (!testResponse.ok) {
      return new Response(JSON.stringify({ error: "API Key inválida" }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Testar chamada para modelo
    console.log("[paint-wall-replicate-simple] Testando modelo...");
    const modelResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { 
        "Authorization": `Token ${REPLICATE_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        version: "5b86c59ce294857162faba2fce7abf6efd4333955a2099d80cf3a6b7d656d2fe",
        input: {
          prompt: "test"
        }
      })
    });

    const result = {
      testAccount: testResponse.ok,
      modelCall: modelResponse.ok,
      modelStatus: modelResponse.status,
      timestamp: new Date().toISOString()
    };

    if (modelResponse.ok) {
      const prediction = await modelResponse.json();
      console.log("[paint-wall-replicate-simple] Sucesso!", prediction);
      return new Response(JSON.stringify({ 
        success: true, 
        result,
        predictionId: prediction.id 
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const error = await modelResponse.text();
      console.error("[paint-wall-replicate-simple] Erro modelo:", modelResponse.status, error);
      return new Response(JSON.stringify({ 
        success: false, 
        result,
        error: error 
      }), {
        status: modelResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error: any) {
    console.error("[paint-wall-replicate-simple] Exception:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
