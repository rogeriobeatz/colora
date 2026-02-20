import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // OPTIMIZATION 1: Simple image hash for cache
    const imageHash = await simpleImageHash(imageBase64);
    
    // Check cache first
    const { data: cached } = await supabase
      .from('wall_cache')
      .select('surfaces')
      .eq('hash', imageHash)
      .single();

    if (cached) {
      console.log("[analyze-room] Cache HIT:", cached.surfaces.length, "surfaces");
      return new Response(
        JSON.stringify({ 
          walls: cached.surfaces, 
          sucesso: true, 
          fromCache: true,
          total: cached.surfaces.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-room] Cache MISS - calling AI");

    const formattedImage = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // OPTIMIZATION 2: System prompt ultra-preciso
    const systemPrompt = `You are an expert Architectural Surface Identifier.

Task: Detect ALL paintable surfaces in interior photos.

### CRITICAL RULES for label_en (English AI names):
- Descriptive + Material + Location + Function
- Examples: 
  ✅ "White Drywall TV Wall" 
  ✅ "Textured Wooden Slat Accent Wall Behind Sofa"
  ✅ "Kitchen Backsplash Ceramic Tiles"
  ❌ "Wall", "Surface 1", "Parede"

### JSON OUTPUT FORMAT (NO OTHER TEXT):
{
  "surfaces": [
    {
      "id": "s1",
      "label_pt": "Parede da TV",
      "label_en": "White Drywall TV Wall",
      "type": "wall", 
      "description": "Main wall with TV mount, matte finish"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: formattedImage } },
              { 
                type: "text", 
                text: "Identifique TODAS superfícies pintáveis. Nomes descritivos em português. **APENAS JSON**." 
              }
            ],
          },
        ],
        temperature: 0.1,  // mais determinístico
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("[analyze-room] AI response preview:", content.substring(0, 200));

    // OPTIMIZATION 3: Parser JSON ultra-robusto
    type Surface = { 
      id: string; 
      label_pt: string; 
      label_en: string; 
      type: string; 
      description: string 
    };

    let detectedSurfaces: Surface[] = [];
    try {
      // Extrai JSON (com ou sem markdown)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      
      // Limpa JSON
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonStr);
      const rawList = parsed.surfaces || parsed.walls || parsed.superficies || [];
      
      if (Array.isArray(rawList)) {
        detectedSurfaces = rawList.map((s: any, index: number) => ({
          id: s.id || `s${index + 1}`,
          label_pt: s.label_pt || s.label || s.nome || "Parede",
          label_en: s.label_en || s.english_label || s.name_en || "Wall Surface",
          description: s.description || "",
          type: (s.type || "wall").toLowerCase()
        }));
      }
    } catch (parseError) {
      console.error("[analyze-room] JSON Parse Error:", parseError);
      throw new Error("Erro ao processar resposta da IA");
    }

    // OPTIMIZATION 4: Filtro inteligente
    const validSurfaces = detectedSurfaces
      .filter((w) => 
        w.label_pt.trim().length > 2 &&
        w.label_en.trim().length > 5 &&  // garante descritivo
        w.type === 'wall' &&             // só paredes
        !w.label_pt.toLowerCase().includes('janela') &&  // sem vidros
        !w.label_pt.toLowerCase().includes('porta') &&   // sem portas
        !w.label_pt.toLowerCase().includes('espelho')    // sem reflexos
      )
      .slice(0, 8)  // máximo 8 paredes
      .map((wall, index) => ({
        ...wall,
        id: `s${index + 1}`  // IDs sequenciais limpos
      }));

    const result = {
      walls: validSurfaces,
      sucesso: true,
      total: validSurfaces.length,
      cacheKey: imageHash
    };

    console.log(`[analyze-room] Final: ${validSurfaces.length} walls detected`);

    // OPTIMIZATION 5: Cache por 24h
    await supabase
      .from('wall_cache')
      .upsert({ 
        hash: imageHash, 
        surfaces: validSurfaces,
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[analyze-room] FATAL ERROR:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        sucesso: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper: hash simples da imagem pra cache
async function simpleImageHash(imageBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(imageBase64.slice(0, 1000));  // primeiros 1KB
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
