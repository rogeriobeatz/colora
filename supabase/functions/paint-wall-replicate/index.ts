import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Decode base64 manualmente (compatível com Deno)
const decodeBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// CORS inline implementation
const generateSimpleCorsHeaders = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigins = [
    "https://colora.app.br",
    "https://www.colora.app.br",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "*.lovableproject.com",
    "*.lovable.app"
  ];
  
  const isAllowed = allowedOrigins.includes(origin) || 
    origin.startsWith("http://localhost:") || 
    origin.startsWith("http://127.0.0.1:") ||
    (origin.startsWith("http://") && allowedOrigins.some(allowed => 
      allowed.startsWith("*.") && origin.endsWith(allowed.slice(2))
    ));
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://colora.app.br",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
};

const createCorsResponse = (req: Request) => {
  const headers = generateSimpleCorsHeaders(req);
  return new Response(null, { headers });
};

const jsonResponse = (data: any, status = 200, req: Request) => {
  const headers = generateSimpleCorsHeaders(req);
  return new Response(JSON.stringify(data), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
};

const REPLICATE_BASE_URL = "https://api.replicate.com/v1";

// Versão do Flux Schnell Inpainting - parâmetros conhecidos e testados
const FLUX_INPAINT_VERSION = "5b86c59ce294857162faba2fce7abf6efd4333955a2099d80cf3a6b7d656d2fe";

serve(async (req: Request) => {
  console.log("[paint-wall-replicate] Request recebido:", req.method, req.url);
  console.log("[paint-wall-replicate] Headers:", Object.fromEntries(req.headers.entries()));
  
  if (req.method === "OPTIONS") return createCorsResponse(req);

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[paint-wall-replicate] ENV vars:", { 
      hasReplicateKey: !!REPLICATE_API_KEY, 
      hasSupabaseUrl: !!SUPABASE_URL, 
      hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY 
    });

    if (!REPLICATE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[paint-wall-replicate] Missing ENV vars");
      return jsonResponse({ error: "Erro de configuração: Variáveis ausentes." }, 500, req);
    }

    // Função de retry com exponential backoff
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(url, options);
        
        // Sucesso ou erro que não deve ser retry
        if (response.ok || response.status === 401 || response.status === 400) {
          return response;
        }
        
        // Rate limiting (429) ou erro de servidor (5xx) - fazer retry
        if (response.status === 429 || response.status >= 500) {
          const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // 1s, 2s, 4s, max 10s
          console.log(`[paint-wall-replicate] Rate limit detectado, retry ${i+1}/${maxRetries} em ${waitTime}ms`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        
        // Outros erros não fazer retry
        return response;
      }
      throw new Error("Max retries exceeded");
    };
    
    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const authHeader = req.headers.get("Authorization");
    console.log("[paint-wall-replicate] Auth header presente:", !!authHeader);
    console.log("[paint-wall-replicate] Auth header (primeiros 50 chars):", authHeader?.substring(0, 50));
    
    if (!authHeader) {
      console.error("[paint-wall-replicate] Authorization header ausente");
      return jsonResponse({ error: "Não autorizado." }, 401, req);
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("[paint-wall-replicate] Token extraído (primeiros 30 chars):", token.substring(0, 30));
    
    const { data: { user }, error: authError } = await serviceRoleClient.auth.getUser(token);
    if (authError || !user) {
      console.error("[paint-wall-replicate] Auth error:", authError);
      return jsonResponse({ error: "Sessão expirada." }, 401, req);
    }
    console.log("[paint-wall-replicate] Usuário autenticado:", user.id);

    const body = await req.json().catch(() => ({}));
    const { imageUrl, imageBase64, paintColor, wallLabel, wallLabelEn, aspectMode } = body;

    if (!paintColor) return jsonResponse({ error: "Cor não fornecida." }, 400, req);

    // 1. Token Check
    const { data: profile } = await serviceRoleClient.from('profiles').select('tokens').eq('id', user.id).single();
    if (!profile || profile.tokens <= 0) return jsonResponse({ error: "Tokens insuficientes." }, 403, req);

    // 2. Prepare Image
    let publicUrl = imageUrl;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const fileName = `${user.id}/rep_${Date.now()}.png`;
      await serviceRoleClient.storage.from('images').upload(fileName, decodeBase64(cleanBase64), { contentType: 'image/png' });
      const { data: signedData } = await serviceRoleClient.storage.from('images').createSignedUrl(fileName, 3600);
      publicUrl = signedData?.signedUrl;
    } else if (imageUrl && imageUrl.includes("supabase.co")) {
      const path = imageUrl.split('/storage/v1/object/public/images/')[1] || imageUrl.split('/storage/v1/object/authenticated/images/')[1];
      if (path) {
        const { data: signedData } = await serviceRoleClient.storage.from('images').createSignedUrl(decodeURIComponent(path), 3600);
        publicUrl = signedData?.signedUrl || publicUrl;
      }
    }

    if (!publicUrl) return jsonResponse({ error: "Imagem não preparada." }, 500, req);

    // 3. AI Task - Flux Schnell Inpainting (rápido, barato e testado)
    const prompt = `Photorealistic interior. The ${wallLabelEn || "wall"} is professionally painted in hex color ${paintColor}. Keep original furniture, lighting, and room layout exactly the same.`;

    console.log("[paint-wall-replicate] Enviando para Flux Schnell Inpainting:", { imageUrl: publicUrl.substring(0, 50) + "...", prompt });

    const response = await fetchWithRetry(`${REPLICATE_BASE_URL}/predictions`, {
      method: "POST",
      headers: { "Authorization": `Token ${REPLICATE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: FLUX_INPAINT_VERSION,
        input: {
          image: publicUrl,
          prompt: prompt,
          mask: publicUrl, // Para pintura completa, usar a mesma imagem como máscara
          num_inference_steps: 20,
          guidance_scale: 7.5
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[paint-wall-replicate] API Error:", response.status, errorText);
      return jsonResponse({ error: `Replicate indisponível (${response.status})` }, response.status === 400 ? 400 : 503, req);
    }
    
    const task = await response.json();
    console.log("[paint-wall-replicate] Replicate Response completo:", JSON.stringify(task, null, 2));
    const predictionId = task?.id;
    console.log("[paint-wall-replicate] PredictionId extraído:", predictionId);
    if (!predictionId) {
      console.error("[paint-wall-replicate] PredictionId não encontrado no response. Response completo:", task);
      return jsonResponse({ error: "Falha ao iniciar IA - predictionId não retornado." }, 400, req);
    }

    // 4. Debit
    await serviceRoleClient.from('profiles').update({ tokens: profile.tokens - 1 }).eq('id', user.id);
    const { data: consumption } = await serviceRoleClient.from('token_consumptions').insert({ 
      user_id: user.id, amount: -1, description: `Pintura: ${wallLabel || 'Parede'} (Replicate)`,
      metadata: { status: 'processing', predictionId, provider: 'replicate' }
    }).select().single();

    // 5. Poll - Flux Schnell Inpainting (~51s) com retry
    let finalImageUrl = "";
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      
      try {
        const pollResponse = await fetchWithRetry(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
          headers: { "Authorization": `Token ${REPLICATE_API_KEY}` }
        });
        const poll = await pollResponse.json();
        
        console.log(`[paint-wall-replicate] Poll ${i+1}/20: status=${poll.status}`);
        
        if (poll.status === "succeeded") {
          finalImageUrl = poll.output?.[0] || poll.output;
          break;
        }
        if (["failed", "canceled"].includes(poll.status)) break;
      } catch (error) {
        console.error(`[paint-wall-replicate] Erro no poll ${i+1}:`, error);
        // Continuar para próxima tentativa mesmo com erro
      }
    }

    if (finalImageUrl) {
      if (consumption) await serviceRoleClient.from('token_consumptions').update({ metadata: { ...consumption.metadata, status: 'success', result_url: finalImageUrl } }).eq('id', consumption.id);
      return jsonResponse({ imageUrl: finalImageUrl, sucesso: true }, 200, req);
    } else {
      await serviceRoleClient.from('profiles').update({ tokens: profile.tokens }).eq('id', user.id);
      if (consumption) await serviceRoleClient.from('token_consumptions').update({ metadata: { ...consumption.metadata, status: 'failed_refunded' } }).eq('id', consumption.id);
      return jsonResponse({ error: "A IA demorou mais de 60 segundos. Token estornado." }, 504, req);
    }

  } catch (err: any) {
    console.error("[replicate] Global Error:", err);
    return jsonResponse({ error: "Erro interno.", details: err.message }, 500, req);
  }
});