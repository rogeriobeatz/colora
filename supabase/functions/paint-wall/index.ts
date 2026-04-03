import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { generateSimpleCorsHeaders, createCorsResponse } from "../_shared/cors-config.ts";

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
    const env = {
      KIE_API_KEY: Deno.env.get("KIE_API_KEY"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    };

    if (!env.KIE_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente KIE_API_KEY ou SUPABASE_URL não configuradas.");
    }
    
    const serviceRoleClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Auth Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Header de autorização ausente.");
    
    const userClient = createClient(env.SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Sessão inválida." }, 401, req);

    // Get Profile for Tokens
    const { data: profile, error: profErr } = await serviceRoleClient.from('profiles').select('tokens').eq('id', user.id).single();
    if (profErr || !profile) return jsonResponse({ error: "Perfil não encontrado." }, 404, req);

    const body = await req.json();
    const { imageBase64, paintColor, wallLabel, wallLabelEn, aspectMode } = body;
    
    let publicUrl = "";
    if (imageBase64.startsWith('http')) {
      publicUrl = imageBase64;
    } else {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const rawBytes = decodeBase64(cleanBase64);
      const tempFileName = `input_${user.id}_${Date.now()}.png`;
      await serviceRoleClient.storage.from('images').upload(tempFileName, rawBytes, { contentType: 'image/png' });
      const { data } = serviceRoleClient.storage.from('images').getPublicUrl(tempFileName);
      publicUrl = data.publicUrl;
    }
    
    const aspectRatio = (aspectMode || "16-9").replace("-", ":");
    const prompt = `Repaint the ${wallLabelEn || wallLabel || "wall"} to the color ${paintColor}. High realism.`;
    
    // 1. Create Task
    const createRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "flux-2/pro-image-to-image",
        input: { input_urls: [publicUrl], prompt, aspect_ratio: aspectRatio, resolution: "1K" }
      })
    });
    
    const createData = await createRes.json();
    if (createData.code !== 200) throw new Error(`Kie API (Create): ${createData.msg}`);
    
    const taskId = createData.data.taskId;
    let finalImageUrl = "";

    // 2. Polling loop
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${env.KIE_API_KEY}` }
      });
      if (!pollRes.ok) continue;
      
      const pollData = await pollRes.json();
      if (pollData.data?.state === "success") {
        const result = pollData.data.resultJson;
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        finalImageUrl = parsed?.resultUrls?.[0] || pollData.data?.recordUrls?.[0];
        if (finalImageUrl) break;
      }
      if (pollData.data?.state === "fail") throw new Error(`Kie falhou: ${pollData.data.failMsg}`);
    }

    if (!finalImageUrl) throw new Error("Tempo limite de processamento esgotado.");

    // 3. Update tokens (opcionalmente silencioso para não travar o retorno)
    try {
      await serviceRoleClient.from('profiles').update({ tokens: Math.max(0, profile.tokens - 1) }).eq('id', user.id);
      await serviceRoleClient.from('token_consumptions').insert({ 
        user_id: user.id, 
        amount: -1, 
        description: "Pintura IA",
        metadata: { task_id: taskId }
      });
    } catch (dbErr) {
      console.error("Erro ao atualizar tokens, mas retornando imagem:", dbErr);
    }

    return jsonResponse({ imageUrl: finalImageUrl, sucesso: true }, 200, req);

  } catch (error: any) {
    console.error("[paint-wall] ERROR:", error.message);
    // Retornamos o erro no JSON para você ver no console
    return jsonResponse({ error: error.message, sucesso: false }, 500, req);
  }
});