import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  console.log("[test-replicate] Iniciando teste...");
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    console.log("[test-replicate] API Key presente:", !!REPLICATE_API_KEY);
    
    if (!REPLICATE_API_KEY) {
      return new Response(JSON.stringify({ error: "API Key ausente" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Teste simples da API
    console.log("[test-replicate] Testando conexão com Replicate...");
    const response = await fetch("https://api.replicate.com/v1/account", {
      headers: { "Authorization": `Token ${REPLICATE_API_KEY}` }
    });

    const result = {
      status: response.status,
      ok: response.ok,
      api_key_present: !!REPLICATE_API_KEY,
      timestamp: new Date().toISOString()
    };

    if (response.ok) {
      const account = await response.json();
      console.log("[test-replicate] Sucesso!", account);
      return new Response(JSON.stringify({ 
        success: true, 
        result,
        account: { username: account.username, name: account.name }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const error = await response.text();
      console.error("[test-replicate] Erro:", response.status, error);
      return new Response(JSON.stringify({ 
        success: false, 
        result,
        error: error 
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error: any) {
    console.error("[test-replicate] Exception:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
