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

    // 3. Caching Logic - TEMPORARIAMENTE DESABILITADO
    const imageHash = await simpleImageHash(imageBase64);
    console.log(`[analyze-room] Image hash: ${imageHash}`);
    
    // TEMPORARIO: Forçar sempre análise nova para garantir roomName
    console.log(`[analyze-room] Cache desabilitado - forçando análise nova para user ${user.id}`);
    
    // Comentado temporariamente para debug
    /*
    const { data: cached } = await serviceRoleClient.from('wall_cache').select('surfaces, room_name, room_type').eq('hash', imageHash).single();

    if (cached) {
      console.log(`[analyze-room] Cache HIT for user ${user.id}`);
      console.log(`[analyze-room] Cached surfaces:`, cached.surfaces);
      console.log(`[analyze-room] Cached room_name:`, cached.room_name);
      console.log(`[analyze-room] Cached room_type:`, cached.room_type);
      return jsonResponse({ 
        walls: cached.surfaces, 
        roomName: cached.room_name || "", 
        roomType: cached.room_type || "", 
        sucesso: true, 
        fromCache: true, 
        total: cached.surfaces.length 
      });
    }
    */

    console.log(`[analyze-room] Cache MISS for user ${user.id}. Processing analysis...`);

    // 4. AI API Call (GRATUITO - não consome tokens)
    const formattedImage = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const systemPrompt = `You are an expert Architectural Surface Identifier and Room Classifier.

Your task is to:
1. Identify the type of room based on the image (kitchen, bedroom, living room, bathroom, office, dining room, etc.)
2. Identify ALL paintable wall surfaces in the image

You must respond with a JSON object containing:
- room_name: A concise, descriptive name for this room in Portuguese (ex: "Cozinha Moderna", "Quarto Principal", "Sala de Estar", "Banheiro Social", "Escritório Home Office")
- room_type: The general room type in Portuguese (ex: "cozinha", "quarto", "sala", "banheiro", "escritório", "sala de jantar")
- surfaces: Array of detected paintable surfaces

For each surface include:
- id: Unique identifier (s1, s2, etc.)
- label_pt: Surface name in Portuguese (ex: "Parede Principal", "Parede da Janela", "Parede do Guarda-Roupa")
- label_en: DETAILED technical description in English for AI painting system (ex: "main back wall with large window", "left side wall next to kitchen cabinets", "wall with built-in wardrobe and mirror", "accent wall behind TV unit", "wall with main entrance door")
- description: Brief description if relevant
- type: Always "wall"

IMPORTANT: 
- Only include walls (not windows, doors, mirrors, etc.)
- Maximum 8 walls
- Focus on large, clearly visible wall surfaces
- Be specific but concise with names
- For label_en: Include spatial context, nearby objects, and wall position (ex: "main back wall with large window", "left side wall next to kitchen cabinets", "wall with built-in wardrobe and mirror", "accent wall behind TV unit", "wall with main entrance door")
- Use descriptive technical language that helps AI painting system understand exactly which wall to paint`;
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "image_url", image_url: { url: formattedImage } }, { type: "text", text: "Analise esta imagem e identifique o tipo de cômodo e todas as superfícies de parede pintáveis. Responda apenas com o JSON solicitado." }] },
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

    // Log da resposta pura da IA antes de qualquer parsing
    console.log(`[analyze-room] PURE AI RESPONSE:`, content);

    // 6. Parse and Filter AI Response
    let detectedSurfaces: any[] = [];
    let roomName = "";
    let roomType = "";
    
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      
      console.log(`[analyze-room] Raw AI response:`, content);
      console.log(`[analyze-room] Parsed JSON:`, jsonStr);
      console.log(`[analyze-room] Parsed object:`, JSON.parse(jsonStr));
      
      const parsed = JSON.parse(jsonStr);
      
      detectedSurfaces = parsed.surfaces || parsed.walls || [];
      roomName = parsed.room_name || "";
      roomType = parsed.room_type || "";
      
      console.log(`[analyze-room] Extracted roomName: "${roomName}"`);
      console.log(`[analyze-room] Extracted roomType: "${roomType}"`);
      console.log(`[analyze-room] Extracted surfaces:`, detectedSurfaces.length);
    } catch (e) {
      console.error("[analyze-room] JSON Parse Error:", e);
      console.error("[analyze-room] Raw content that failed:", content);
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

    // 7. Caching (sem consumo de tokens - análise é gratuita)
    await serviceRoleClient.from('wall_cache').upsert({ 
      hash: imageHash, 
      surfaces: validSurfaces, 
      room_name: roomName, 
      room_type: roomType, 
      created_at: new Date().toISOString() 
    });

    const result = { 
      walls: validSurfaces, 
      roomName: roomName, 
      roomType: roomType,
      sucesso: true, 
      total: validSurfaces.length, 
      cacheKey: imageHash 
    };
    console.log(`[analyze-room] Final: ${validSurfaces.length} walls detected for user ${user.id}, room: "${roomName}"`);
    
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