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
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY")
    };

    if (!env.KIE_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Configurações ausentes.");
    
    const serviceRoleClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Sessão inválida." }, 401, req);

    const { data: profile } = await serviceRoleClient.from('profiles').select('tokens').eq('id', user.id).single();
    if (!profile || profile.tokens <= 0) return jsonResponse({ error: "Saldo insuficiente." }, 403, req);

    const { imageBase64, imageUrl, paintColor, wallLabel, wallLabelEn, aspectMode } = await req.json();

    // 1. ATOMIC DEBIT (ONLY ONCE)
    const { error: debitError } = await serviceRoleClient.from('profiles')
      .update({ tokens: profile.tokens - 1 })
      .eq('id', user.id)
      .gt('tokens', 0);

    if (debitError) throw new Error("Erro ao debitar token.");

    const { data: consumption } = await serviceRoleClient.from('token_consumptions').insert({ 
      user_id: user.id, 
      amount: -1, 
      description: `Pintura: ${wallLabel || 'Parede'}`,
      metadata: { status: 'processing', paintColor }
    }).select().single();

    // 2. Prepare Image
    let publicUrl = imageUrl;
    if (!publicUrl && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const fileName = `input_${user.id}_${Date.now()}.png`;
      await serviceRoleClient.storage.from('images').upload(fileName, decodeBase64(cleanBase64), { contentType: 'image/png' });
      publicUrl = serviceRoleClient.storage.from('images').getPublicUrl(fileName).data.publicUrl;
    }

    // 3. AI Task
    const prompt = `Repaint the ${wallLabelEn || "wall"} to color ${paintColor}. High realism.`;
    const createRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "flux-2/pro-image-to-image",
        input: { input_urls: [publicUrl], prompt, aspect_ratio: (aspectMode || "16:9").replace("-", ":") }
      })
    });
    
    const taskId = (await createRes.json()).data?.taskId;
    if (!taskId) throw new Error("Falha na IA.");

    let finalImageUrl = "";
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await (await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${env.KIE_API_KEY}` }
      })).json();
      
      if (poll.data?.state === "success") {
        const res = typeof poll.data.resultJson === 'string' ? JSON.parse(poll.data.resultJson) : poll.data.resultJson;
        finalImageUrl = res?.resultUrls?.[0] || poll.data?.recordUrls?.[0];
        if (finalImageUrl) break;
      }
    }

    if (finalImageUrl) {
      await serviceRoleClient.from('token_consumptions').update({ 
        metadata: { status: 'success', task_id: taskId, result_url: finalImageUrl } 
      }).eq('id', consumption.id);
      return jsonResponse({ imageUrl: finalImageUrl, sucesso: true });
    } else {
      await serviceRoleClient.from('token_consumptions').update({ metadata: { status: 'timeout' } }).eq('id', consumption.id);
      throw new Error("IA Timeout.");
    }

  } catch (error: any) {
    return jsonResponse({ error: error.message, sucesso: false }, 500, req);
  }
});
