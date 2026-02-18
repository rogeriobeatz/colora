import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formattedImage = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // --- PROMPT TRADUZIDO E ADAPTADO ---
    const systemPrompt = `You are an expert Architectural AI.

Task: Identify paintable surfaces in the image.

### OUTPUT RULES:
1. Identify surfaces visible in the image.
2. Provide names in TWO languages:
   - **label_pt**: Portuguese name for the User Interface (e.g., "Parede da TV").
   - **label_en**: English semantic name for the Image Generation AI (e.g., "TV Wall").
3. **label_en** MUST be descriptive and material-aware to avoid confusion.
   - WRONG: "Wall 1"
   - RIGHT: "White Drywall next to the Wooden Panel"

### JSON OUTPUT FORMAT:
{
  "surfaces": [
    {
      "id": "s1",
      "label_pt": "Parede da Janela",
      "label_en": "Window Wall", 
      "type": "wall",
      "description": "Parede lateral branca ao lado da cortina."
    },
    {
      "id": "s2",
      "label_pt": "Painel da TV",
      "label_en": "Wooden Slat Wall", 
      "type": "wall",
      "description": "Painel de madeira ripada."
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
              { type: "text", text: "Analise esta imagem e identifique as superfícies pintáveis com nomes em Português. Retorne apenas JSON." }
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-room] API Error:", response.status, errorText);
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("[analyze-room] Resposta IA:", content.substring(0, 500));

    // Parser JSON Robusto
    type Surface = { id: string; label: string; english_label: string; description: string; type: string };
    let detectedSurfaces: Surface[] = [];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonStr);
      const rawList = parsed.surfaces || parsed.walls || parsed.superficies || [];
      
      if (Array.isArray(rawList)) {
        detectedSurfaces = rawList.map((s: any, index: number) => ({
          id: s.id || `surface_${index}`,
          label: s.label_pt || s.label || s.nome || "Parede",
          english_label: s.label_en || s.name_en || "Wall",
          description: s.description || "",
          type: (s.type || "wall").toLowerCase()
        }));
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("Erro ao processar resposta da IA");
    }

    // Filtra vazios
    const validSurfaces = detectedSurfaces.filter((w) => w.label && w.label.length > 0);

    return new Response(
      JSON.stringify({ 
        walls: validSurfaces, 
        sucesso: true,
        total: validSurfaces.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        sucesso: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});