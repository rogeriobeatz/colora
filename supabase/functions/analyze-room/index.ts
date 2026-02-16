import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
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
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-room] LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format image base64
    const formattedImage = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // --- OTIMIZAÇÃO DO PROMPT PARA INTERNO E EXTERNO ---
    const systemPrompt = `You are an expert Architectural & Spatial Analysis AI.

Your task is to analyze a photo of a space (Interior, Exterior, or Commercial) and identify ALL visibly paintable surfaces.

### SCOPE OF ANALYSIS:
- **Interiors:** Walls, Ceilings.
- **Exteriors:** Facades, Exterior Walls, Garden Walls, Fences, Pavements/Floors.

### IDENTIFICATION RULES:
1. **Visibility:** ONLY list surfaces clearly visible. Do NOT list obstructed surfaces.
2. **Semantic Naming (Crucial):** Name the surface based on context.
   - *Interior:* "Wall behind TV", "Kitchen Wall", "Bedroom Ceiling".
   - *Exterior:* "Main Facade", "Garage Wall", "Side Fence", "Driveway Floor", "Upper Balcony Wall".
3. **Paintability:** Ignore glass, windows, raw stone, or areas that typically aren't painted.
4. **Surface Type:** Classify as 'wall', 'ceiling', or 'floor'.

### OUTPUT FORMAT (Strict JSON):
Return a JSON object with a "surfaces" array.

Example JSON:
{
  "surfaces": [
    {
      "id": "s1",
      "label": "Main Facade Wall",
      "type": "wall",
      "description": "The front exterior wall with the house number."
    },
    {
      "id": "s2",
      "label": "Garage Ceiling",
      "type": "ceiling",
      "description": "The visible ceiling inside the open garage."
    }
  ]
}`;

    // Chamada para a API (Gemini via Lovable)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Excelente escolha, rápido e bom com visão
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: formattedImage } },
              { type: "text", text: "Analyze this image and identify paintable surfaces with semantic names. Return JSON only." }
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-room] API Gateway Error:", response.status, errorText);
      
      if (response.status === 429) throw new Error("Rate limit exceeded.");
      if (response.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("[analyze-room] AI Response:", content.substring(0, 500));

    // --- PARSER DE JSON ROBUSTO ---
    let detectedSurfaces = [];
    try {
      // Tenta limpar Markdown (```json ... ```)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      
      // Busca o primeiro { e o último } para evitar texto extra
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonStr);
      
      // Normaliza qualquer formato que a IA devolver
      const rawList = parsed.surfaces || parsed.walls || parsed.superficies || [];
      
      if (Array.isArray(rawList)) {
        detectedSurfaces = rawList.map((s: any, index: number) => ({
          id: s.id || `surface_${index}_${Date.now()}`,
          label: s.label || s.name || s.nome || `Surface ${index + 1}`,
          description: s.description || s.descricao || "",
          type: (s.type || "wall").toLowerCase() // 'wall', 'ceiling', 'floor'
        }));
      }

    } catch (parseError) {
      console.error("[analyze-room] JSON Parse Error:", parseError);
      throw new Error("Não foi possível processar a resposta da IA.");
    }

    // Filtra itens vazios
    const validSurfaces = detectedSurfaces.filter((w: any) => w.label && w.label.length > 0);

    console.log(`[analyze-room] Identified ${validSurfaces.length} surfaces`);

    // Resposta de Sucesso
    return new Response(
      JSON.stringify({ 
        walls: validSurfaces, // Mantive a chave 'walls' para compatibilidade com seu frontend, mas contém tudo
        sucesso: true,
        total: validSurfaces.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-room] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        sucesso: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});