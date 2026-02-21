import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = {
      LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY")
    };

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
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

    // 2. Body Validation
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return jsonResponse({ error: "imageBase64 is required" }, 400);
    }

    // 3. Caching Logic
    const imageHash = await simpleImageHash(imageBase64);
    const { data: cached } = await serviceRoleClient.from('wall_cache').select('surfaces').eq('hash', imageHash).single();

    if (cached) {
      console.log(`[analyze-room] Cache HIT for user ${user.id}`);
      return jsonResponse({ walls: cached.surfaces, sucesso: true, fromCache: true, total: cached.surfaces.length });
    }

    console.log(`[analyze-room] Cache MISS for user ${user.id}. Checking credits...`);

    // 4. Credit Check
    const { data: profile, error: profileError } = await serviceRoleClient.from('profiles').select('ai_credits').eq('id', user.id).single();

    if (profileError || !profile) {
      return jsonResponse({ error: "User profile not found." }, 404);
    }

    if (profile.ai_credits <= 0) {
      return jsonResponse({ error: "Insufficient AI credits." }, 403);
    }
    
    console.log(`User ${user.id} has ${profile.ai_credits} credits. Proceeding...`);

    // 5. AI API Call
    const formattedImage = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const systemPrompt = `You are an expert Architectural Surface Identifier...`; // Full prompt omitted for brevity
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "image_url", image_url: { url: formattedImage } }, { type: "text", text: "Identifique TODAS superfícies pintáveis..." }] },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status} - ${await response.text()}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // 6. Parse and Filter AI Response
    let detectedSurfaces: any[] = [];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(jsonStr);
      detectedSurfaces = parsed.surfaces || parsed.walls || [];
    } catch (e) {
      console.error("[analyze-room] JSON Parse Error:", e);
      throw new Error("Error processing AI response");
    }

    const validSurfaces = detectedSurfaces
      .map((s: any, index: number) => ({
        id: s.id || `s${index + 1}`,
        label_pt: s.label_pt || s.label || s.nome || "Parede",
        label_en: s.label_en || s.english_label || s.name_en || "Wall Surface",
        description: s.description || "",
        type: (s.type || "wall").toLowerCase()
      }))
      .filter(w => w.label_pt.trim().length > 2 && w.label_en.trim().length > 5 && w.type === 'wall' && !/janela|porta|espelho/i.test(w.label_pt))
      .slice(0, 8)
      .map((wall, index) => ({ ...wall, id: `s${index + 1}` }));

    // 7. Post-Success Credit Deduction & Caching
    try {
      const { error: decrementError } = await serviceRoleClient.rpc('decrement_ai_credits', { p_user_id: user.id, p_amount: 1 });
      if (decrementError) throw decrementError;
      console.log(`Successfully decremented 1 credit from user ${user.id}`);
    } catch (e) {
      console.error(`CRITICAL: Failed to decrement credits for user ${user.id} after successful AI call.`, e);
    }
    
    await serviceRoleClient.from('wall_cache').upsert({ hash: imageHash, surfaces: validSurfaces, created_at: new Date().toISOString() });

    const result = { walls: validSurfaces, sucesso: true, total: validSurfaces.length, cacheKey: imageHash };
    console.log(`[analyze-room] Final: ${validSurfaces.length} walls detected for user ${user.id}`);
    
    return jsonResponse(result);

  } catch (error: any) {
    console.error("[analyze-room] FATAL ERROR:", error.message);
    return jsonResponse({ error: error.message, sucesso: false }, 500);
  }
});

async function simpleImageHash(imageBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(imageBase64.slice(0, 1000));
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}