import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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

const KIE_BASE_URL = "https://api.kie.ai";

const jsonResponse = (data: any, status = 200, req: Request) => {
  const headers = generateSimpleCorsHeaders(req);
  return new Response(JSON.stringify(data), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") return createCorsResponse(req);

  try {
    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KIE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[paint-wall] Missing ENV vars:", { KIE: !!KIE_API_KEY, URL: !!SUPABASE_URL, SRK: !!SUPABASE_SERVICE_ROLE_KEY });
      return jsonResponse({ error: "Erro de configuração: Variáveis de ambiente ausentes no Supabase." }, 500, req);
    }
    
    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Falta cabeçalho de autorização." }, 401, req);

    const { data: { user }, error: userError } = await serviceRoleClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      console.error("[paint-wall] Auth error:", userError);
      return jsonResponse({ error: "Sessão inválida ou expirada." }, 401, req);
    }

    const body = await req.json().catch(() => ({}));
    console.log("[paint-wall] Request body recebido:", { 
      hasImageBase64: !!body.imageBase64, 
      hasImageUrl: !!body.imageUrl, 
      paintColor: body.paintColor,
      wallLabel: body.wallLabel,
      wallLabelEn: body.wallLabelEn,
      aspectMode: body.aspectMode 
    });
    
    const { imageBase64, imageUrl, paintColor, wallLabel, wallLabelEn, aspectMode } = body;

    if (!paintColor) {
      console.error("[paint-wall] paintColor não fornecido");
      return jsonResponse({ error: "Cor da tinta não fornecida." }, 400, req);
    }

    const { data: profile, error: profileError } = await serviceRoleClient.from('profiles').select('tokens').eq('id', user.id).single();
    if (profileError || !profile) return jsonResponse({ error: "Erro ao verificar saldo." }, 500, req);
    if (profile.tokens <= 0) return jsonResponse({ error: "Saldo insuficiente." }, 403, req);

    let publicUrl = imageUrl;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const fileName = `${user.id}/input_${Date.now()}.png`;
      const { error: uploadError } = await serviceRoleClient.storage.from('images').upload(fileName, decodeBase64(cleanBase64), { contentType: 'image/png', upsert: true });
      if (uploadError) throw uploadError;
      const { data: signedData } = await serviceRoleClient.storage.from('images').createSignedUrl(fileName, 3600);
      publicUrl = signedData?.signedUrl;
    } else if (imageUrl && imageUrl.includes("supabase.co")) {
      const path = imageUrl.split('/storage/v1/object/public/images/')[1] || imageUrl.split('/storage/v1/object/authenticated/images/')[1];
      if (path) {
        const { data: signedData } = await serviceRoleClient.storage.from('images').createSignedUrl(decodeURIComponent(path), 3600);
        publicUrl = signedData?.signedUrl || publicUrl;
      }
    }

    if (!publicUrl) return jsonResponse({ error: "Falha ao preparar imagem para a IA." }, 500, req);

    const prompt = `Photorealistic interior. The ${wallLabelEn || "wall"} is professionally painted in hex color ${paintColor}. Maintain all original lighting and textures.`;
    
    const kiePayload = {
      model: "flux-2/pro-image-to-image",
      input: { 
        input_urls: [publicUrl], 
        prompt, 
        aspect_ratio: (aspectMode || "16:9").replace("-", ":"),
        resolution: "1K"
      }
    };
    
    console.log("[paint-wall] Enviando para KIE.ai:", JSON.stringify(kiePayload, null, 2));
    
    const aiRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(kiePayload)
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("[paint-wall] KIE AI Error:", aiRes.status, errorText);
      console.error("[paint-wall] KIE Request que falhou:", JSON.stringify(kiePayload, null, 2));
      return jsonResponse({ error: `IA Indisponível (${aiRes.status}): ${errorText}` }, aiRes.status === 400 ? 400 : 503, req);
    }

    const taskData = await aiRes.json();
    console.log("[paint-wall] KIE Response completo:", JSON.stringify(taskData, null, 2));
    const taskId = taskData.data?.taskId;
    console.log("[paint-wall] TaskId extraído:", taskId);
    if (!taskId) {
      console.error("[paint-wall] TaskId não encontrado no response. Response completo:", taskData);
      return jsonResponse({ error: "Falha ao iniciar tarefa na IA - taskId não retornado." }, 400, req);
    }

    await serviceRoleClient.from('profiles').update({ tokens: profile.tokens - 1 }).eq('id', user.id);
    const { data: consumption } = await serviceRoleClient.from('token_consumptions').insert({ 
      user_id: user.id, amount: -1, description: `Pintura: ${wallLabel || 'Parede'}`,
      metadata: { status: 'processing', taskId, provider: 'kie' }
    }).select().single();

    let finalImageUrl = "";
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await (await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` }
      })).json();
      
      if (poll.data?.state === "success") {
        const res = typeof poll.data.resultJson === 'string' ? JSON.parse(poll.data.resultJson) : poll.data.resultJson;
        finalImageUrl = res?.resultUrls?.[0] || poll.data?.recordUrls?.[0];
        break;
      }
      if (["failed", "timeout", "canceled"].includes(poll.data?.state)) break;
    }

    if (finalImageUrl) {
      if (consumption) await serviceRoleClient.from('token_consumptions').update({ metadata: { ...consumption.metadata, status: 'success', result_url: finalImageUrl } }).eq('id', consumption.id);
      return jsonResponse({ imageUrl: finalImageUrl, sucesso: true }, 200, req);
    } else {
      await serviceRoleClient.from('profiles').update({ tokens: profile.tokens }).eq('id', user.id);
      if (consumption) await serviceRoleClient.from('token_consumptions').update({ metadata: { ...consumption.metadata, status: 'failed_refunded' } }).eq('id', consumption.id);
      return jsonResponse({ error: "A IA demorou muito. Crédito estornado." }, 504, req);
    }
  } catch (err: any) {
    console.error("[paint-wall] Global Error:", err);
    return jsonResponse({ error: "Ocorreu um erro interno na função de pintura.", details: err.message }, 500, req);
  }
});