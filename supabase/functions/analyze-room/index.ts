import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateSimpleCorsHeaders, createCorsResponse } from "../_shared/cors-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://colora.app.br",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin"
};

const jsonResponse = (data: any, status = 200, req: Request) => {
  const headers = generateSimpleCorsHeaders(req);
  return new Response(JSON.stringify(data), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
};

async function cryptoHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return createCorsResponse(req);

  try {
    const { LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = {
      LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY")
    };

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Configurações ausentes.");

    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Autenticação requerida." }, 401, req);

    const { imageBase64, imageUrl, cropCoordinates, aspectMode } = await req.json();
    if (!imageBase64 && !imageUrl) return jsonResponse({ error: "Imagem não fornecida." }, 400, req);

    // Hash SHA-256 para Cache
    const imageSource = imageBase64 || imageUrl;
    const imageHash = await cryptoHash(imageSource);
    
    // ISOLAMENTO TOTAL: Busca cache apenas para ESTE user_id
    const { data: cached } = await serviceRoleClient.from('wall_cache')
      .select('surfaces, room_name, room_type')
      .eq('hash', imageHash)
      .eq('user_id', user.id)
      .single();

    if (cached) {
      console.log(`[analyze-room] Cache HIT for user ${user.id}: ${imageHash}`);
      return jsonResponse({ 
        walls: cached.surfaces, 
        roomName: cached.room_name, 
        roomType: cached.room_type, 
        sucesso: true, 
        fromCache: true 
      }, 200, req);
    }

    // AI Call
    const formattedImage = imageUrl || (imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an expert Architectural Surface Identifier. Identify room type and all paintable walls. 
            Respond with JSON: { room_name: string, room_type: string, surfaces: [{ id, label_pt, label_en, type: "wall" }] }` 
          },
          { role: "user", content: [{ type: "image_url", image_url: { url: formattedImage } }, { type: "text", text: "Analyze this room." }] },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) throw new Error("Falha na API de IA.");

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const parsed = JSON.parse(jsonMatch[1]?.trim() || content);

    const walls = (parsed.surfaces || []).map((s: any, i: number) => ({
      id: s.id || `s${i+1}`,
      label_pt: s.label_pt || "Parede",
      label_en: s.label_en || "Wall",
      type: "wall"
    }));

    // Save to cache WITH user_id
    await serviceRoleClient.from('wall_cache').upsert({ 
      hash: imageHash, 
      user_id: user.id,
      surfaces: walls, 
      room_name: parsed.room_name, 
      room_type: parsed.room_type 
    });

    return jsonResponse({ 
      walls, 
      roomName: parsed.room_name, 
      roomType: parsed.room_type, 
      sucesso: true 
    }, 200, req);

  } catch (error: any) {
    return jsonResponse({ error: error.message, sucesso: false }, 500, req);
  }
});
