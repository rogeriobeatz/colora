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
        JSON.stringify({ error: "imageBase64 é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-room] LOVABLE_API_KEY não configurada");
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Verificar e formatar a imagem base64
    const formattedImage = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Prompt otimizado para detecção semântica de superfícies
    const systemPrompt = `Você é um especialista em visão computacional para análise de ambientes internos.

Sua tarefa é analisar uma foto de um ambiente interno e identificar todas as superfícies pintáveis visíveis.

SUPERFÍCIES A DETECTAR:
1. PAREDES - superfícies verticais que formam o ambiente
2. TETO - superfície superior do ambiente
3. CHÃO/PISO - superfície inferior do ambiente
4. Outras superfícies pintáveis (nichos, pilares, etc)

REGRAS IMPORTANTES:
- Cada superfície deve ter um polígono que delimita sua área visível
- Use coordenadas PERCENTUAIS (0-100) onde (0,0) é o canto superior esquerdo e (100,100) é o canto inferior direito
- Cada polígono deve ter entre 4 e 8 pontos
- Dê nomes descritivos em PORTUGUÊS: "Parede Esquerda", "Parede Direita", "Parede do Fundo", "Parede Frontal", "Teto", "Chão"
- Se houver múltiplas paredes do mesmo tipo, numere: "Parede Esquerda 1", "Parede Esquerda 2"
- Ignore móveis, janelas, portas, espelhos e objetos decorativos - apenas as superfícies arquiteturais
- Se uma parede for parcialmente ocultada por móveis, ainda assim delimite a área completa da parede

FORMATO DE RESPOSTA (JSON obrigatório):
{
  "superficies": [
    {
      "tipo": "parede|teto|piso|outro",
      "nome": "Nome descritivo em português",
      "poligono": [
        {"x": 0, "y": 0},
        {"x": 25, "y": 5},
        {"x": 25, "y": 95},
        {"x": 0, "y": 100}
      ]
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
              { type: "text", text: "Analise esta imagem e identifique todas as superfícies pintáveis (paredes, teto, chão). Retorne o resultado em JSON com o formato especificado." }
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-room] Erro na API Gateway:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Por favor, adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("[analyze-room] Resposta da IA:", content.substring(0, 500));

    // Extrair JSON da resposta
    let superficies = [];
    try {
      // Tentar encontrar JSON dentro de blocos de código markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      
      // Se não encontrou em código, procurar objeto JSON diretamente
      if (!jsonStr.includes("{") || !jsonStr.includes("}")) {
        const directMatch = content.match(/\{[\s\S]*\}/);
        if (directMatch) {
          jsonStr = directMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);
      
      // Normalizar o formato de resposta
      if (Array.isArray(parsed.superficies)) {
        superficies = parsed.superficies;
      } else if (Array.isArray(parsed.walls)) {
        // Compatibilidade com formato antigo
        superficies = parsed.walls.map((w: any) => ({
          tipo: "parede",
          nome: w.label || w.nome || "Parede",
          poligono: w.polygon || w.poligono || [],
        }));
      } else if (Array.isArray(parsed.surfaces)) {
        superficies = parsed.surfaces;
      }
    } catch (parseError) {
      console.error("[analyze-room] Erro ao fazer parse do JSON:", parseError);
      console.error("[analyze-room] Conteúdo recebido:", content.substring(0, 1000));
      throw new Error("Não foi possível interpretar a resposta da IA");
    }

    // Validar e normalizar cada superfície
    const superficiesValidadas = superficies.map((superficie: any, index: number) => {
      const poligono = (superficie.poligono || superficie.polygon || []).map((p: any) => ({
        x: Math.max(0, Math.min(100, Number(p.x) || Number(p[0]) || 0)),
        y: Math.max(0, Math.min(100, Number(p.y) || Number(p[1]) || 0)),
      }));

      return {
        id: `superficie_${index}_${Date.now()}`,
        tipo: superficie.tipo || superficie.type || "parede",
        nome: superficie.nome || superficie.label || superficie.name || `Superfície ${index + 1}`,
        poligono: poligono.length >= 3 ? poligono : [], // Polígonos precisam de pelo menos 3 pontos
      };
    }).filter((s: any) => s.poligono.length >= 3);

    console.log(`[analyze-room] Detectadas ${superficiesValidadas.length} superfícies`);

    if (superficiesValidadas.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Não foi possível identificar superfícies na imagem",
          superficies: [],
          message: "Tente usar uma foto mais clara do ambiente"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        superficies: superficiesValidadas,
        sucesso: true,
        total: superficiesValidadas.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-room] Erro fatal:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao analisar ambiente",
        sucesso: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});