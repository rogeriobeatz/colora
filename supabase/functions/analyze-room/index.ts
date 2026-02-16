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
      console.error("[analyze-room] LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format image base64
    const formattedImage = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Enhanced prompt in English with semantic wall identification
    const systemPrompt = `You are an expert Interior Design AI Assistant specialized in spatial analysis.

Your task is to analyze an indoor photo and identify the **VISIBLY PAINTABLE** surfaces (walls, ceiling).

### ANALYSIS RULES:
1. **Visibility is Key:** ONLY list surfaces that are clearly visible in the image. Do NOT list walls that are behind the camera or obstructed.
2. **Semantic Naming:** Name the wall based on the most prominent object *in front of it* or *on it*.
   - Priority 1: "Wall behind [Furniture]" (e.g., "Wall behind the grey sofa", "Wall behind the bed")
   - Priority 2: "Wall with [Feature]" (e.g., "Wall with the large window", "Wall with the TV")
   - Priority 3: Position (e.g., "Left side wall", "Back wall", "Corridor wall")
3. **Paintability:** Ignore surfaces that cannot be painted (e.g., walls fully covered by cabinets, tiled kitchen backsplashes, glass walls).
4. **Surface Type:** Identify if it is a 'wall', 'ceiling', or 'floor'.

### OUTPUT FORMAT (Strict JSON):
Return a JSON object with a "surfaces" array. No markdown, no conversation.

Example JSON Structure:
{
  "surfaces": [
    {
      "id": "surface_1",
      "label": "Wall behind the Sofa",
      "type": "wall",
      "description": "The main wall in the center background behind the grey couch."
    },
    {
      "id": "surface_2",
      "label": "Ceiling",
      "type": "ceiling",
      "description": "The white ceiling area visible at the top."
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
              { type: "text", text: "Analyze this room and identify all paintable wall surfaces. Give each wall a descriptive semantic name based on what is on or near it. Return only valid JSON." }
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
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few seconds." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("[analyze-room] AI Response:", content.substring(0, 500));

    // Parse JSON from response
    let walls = [];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let jsonStr = jsonMatch[1]?.trim() || content;
      
      if (!jsonStr.includes("{") || !jsonStr.includes("}")) {
        const directMatch = content.match(/\{[\s\S]*\}/);
        if (directMatch) {
          jsonStr = directMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);
      
      // Normalize response format
      if (Array.isArray(parsed.walls)) {
        walls = parsed.walls;
      } else if (Array.isArray(parsed.superficies)) {
        walls = parsed.superficies.map((s: any) => ({
          id: s.id || `wall_${Date.now()}`,
          label: s.nome || s.label || s.name || "Wall",
          description: s.descricao || s.description || "",
        }));
      } else if (Array.isArray(parsed.surfaces)) {
        walls = parsed.surfaces;
      }
    } catch (parseError) {
      console.error("[analyze-room] JSON Parse Error:", parseError);
      console.error("[analyze-room] Content received:", content.substring(0, 1000));
      throw new Error("Unable to parse AI response");
    }

    // Validate and normalize walls
    const validWalls = walls.map((wall: any, index: number) => ({
      id: wall.id || `wall_${index}_${Date.now()}`,
      label: wall.label || wall.name || `Wall ${index + 1}`,
      description: wall.description || wall.descricao || "",
    })).filter((w: any) => w.label && w.label.length > 0);

    // Ensure we have at least 3 walls (typical room)
    const normalizedWalls = validWalls.length >= 3 
      ? validWalls.slice(0, 6)  // Max 6 walls
      : validWalls;

    console.log(`[analyze-room] Identified ${normalizedWalls.length} walls`);

    if (normalizedWalls.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Could not identify walls in the image",
          walls: [],
          message: "Try using a clearer photo of the room"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        walls: normalizedWalls,
        sucesso: true,
        total: normalizedWalls.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-room] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error analyzing room",
        sucesso: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});