import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ImageScript from "https://deno.land/x/imagescript@1.2.16/mod.ts";
import { decode as decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KIE_BASE_URL = "https://api.kie.ai";

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  status,
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Environment and Auth Validation
    const { KIE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = {
      KIE_API_KEY: Deno.env.get("KIE_API_KEY"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY")
    };

    if (!KIE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("Environment variables not configured");
      return jsonResponse({ error: "Internal server configuration error." }, 500);
    }
    
    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Authentication required." }, 401);
    }

    // 2. Credit Check (before any processing)
    const { data: profile, error: profileError } = await serviceRoleClient.from('profiles').select('ai_credits').eq('id', user.id).single();

    if (profileError || !profile) {
      return jsonResponse({ error: "User profile not found." }, 404);
    }

    if (profile.ai_credits <= 0) {
      return jsonResponse({ error: "Insufficient AI credits." }, 403);
    }
    
    console.log(`[paint-wall] User ${user.id} has ${profile.ai_credits} credits. Proceeding...`);

    // 3. Body validation
    const { imageBase64, paintColor, wallLabel, wallLabelEn, cropCoordinates } = await req.json();

    if (!imageBase64 || !paintColor) {
      throw new Error("Image and Color are required");
    }
    const technicalWallName = wallLabelEn || wallLabel || "wall";

    // 4. Image Processing
    let image = await ImageScript.decode(decodeBase64(imageBase64.replace(/^data:image\/[^;]+;base64,/, "")));
    
    if (cropCoordinates && typeof image.width === 'number' && typeof image.height === 'number') {
      const { width: origW, height: origH } = image;
      const cropX = Math.floor((cropCoordinates.x / 100) * origW);
      const cropY = Math.floor((cropCoordinates.y / 100) * origH);
      const cropW = Math.floor((cropCoordinates.width / 100) * origW);
      const cropH = Math.floor((cropCoordinates.height / 100) * origH);
      image.crop(cropX, cropY, cropW, cropH);
    }
    
    const processedImageBytes = await image.encode();
    const fileName = `input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await serviceRoleClient.storage.from('images').upload(fileName, processedImageBytes, { contentType: 'image/png' });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = serviceRoleClient.storage.from('images').getPublicUrl(fileName);

    // 5. AI API Call
    const aspectRatio = image.width >= image.height ? "16:9" : "2:3";
    const prompt = `Change ONLY the **${technicalWallName}** color to "${paintColor}". ...`; // Prompt truncated
    
    const payload = { model: "flux-2/pro-image-to-image", input: { input_urls: [publicUrl], prompt, aspect_ratio: aspectRatio, resolution: "1K" }};
    
    const createRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!createRes.ok) throw new Error(`Kie Create Error (${createRes.status}): ${await createRes.text()}`);
    
    const createData = await createRes.json();
    if (createData.code !== 200) throw new Error(`Kie API Error: ${createData.msg}`);
    
    const taskId = createData.data.taskId;
    const finalImageUrl = await pollKieTask(taskId, KIE_API_KEY);

    // 6. Post-Success Credit Deduction
    try {
      const { error: decrementError } = await serviceRoleClient.rpc('decrement_ai_credits', { p_user_id: user.id, p_amount: 1 });
      if (decrementError) throw decrementError;
      console.log(`[paint-wall] Successfully decremented 1 credit from user ${user.id}`);
    } catch (e) {
      console.error(`CRITICAL: Failed to decrement credits for user ${user.id} after successful AI call.`, e);
    }
    
    // Cleanup
    setTimeout(() => serviceRoleClient.storage.from('images').remove([fileName]), 3600000);

    return jsonResponse({ imageUrl: finalImageUrl, sucesso: true, details: { aspectRatio, wallName: technicalWallName } });

  } catch (error: any) {
    console.error("[paint-wall] FATAL ERROR:", error.message);
    return jsonResponse({ error: error.message, sucesso: false }, 500);
  }
});

async function pollKieTask(taskId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: { "Authorization": `Bearer ${apiKey}` } });
    if (!res.ok) continue;
    const body = await res.json();
    if (body.data.state === "success") return JSON.parse(body.data.resultJson).resultUrls[0];
    if (body.data.state === "fail") throw new Error(`Kie failed: ${body.data.failMsg}`);
  }
  throw new Error("Timeout: Processing took too long.");
}