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
    const systemPrompt = `Você é uma IA especialista em Arquitetura e Análise Espacial.

Sua tarefa é analisar uma foto de um ambiente (Interno, Externo ou Comercial) e identificar TODAS as superfícies visíveis que podem ser pintadas.

### REGRAS DE IDENTIFICAÇÃO:
1. **Visibilidade:** Liste APENAS superfícies claramente visíveis. NÃO liste paredes obstruídas ou fora de ângulo.
2. **Nomenclatura Semântica (IMPORTANTE):** Dê nomes descritivos em **PORTUGUÊS (PT-BR)** baseados no contexto.
   - *Interno:* "Parede atrás da TV", "Parede do Sofá", "Teto do Quarto", "Parede da Janela", "Parede Lateral Esquerda".
   - *Externo:* "Fachada Principal", "Muro Lateral", "Piso da Garagem", "Muro do Jardim", "Parede da Varanda".
3. **Pintável:** Ignore vidros, pedras brutas, madeira envernizada ou áreas que tipicamente não se pinta.
4. **Tipo de Superfície:** Classifique como 'wall' (parede), 'ceiling' (teto) ou 'floor' (piso).

### FORMATO DE SAÍDA (JSON Estrito):
Retorne apenas um objeto JSON com um array "surfaces". Sem markdown.

Exemplo de JSON:
{
  "surfaces": [
    {
      "id": "s1",
      "label": "Parede atrás do Sofá",
      "type": "wall",
      "description": "A parede principal no fundo, atrás do sofá cinza."
    },
    {
      "id": "s2",
      "label": "Teto",
      "type": "ceiling",
      "description": "A área branca do teto visível acima."
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
    let detectedSurfaces = [];
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
          id: s.id || `surface_${index}_${Date.now()}`,
          label: s.label || s.name || s.nome || `Superfície ${index + 1}`,
          description: s.description || s.descricao || "",
          type: (s.type || "wall").toLowerCase()
        }));
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("Erro ao processar resposta da IA");
    }

    // Filtra vazios
    const validSurfaces = detectedSurfaces.filter((w: any) => w.label && w.label.length > 0);

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