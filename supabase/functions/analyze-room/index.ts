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
    const systemPrompt = `You are a computer vision expert specialized in indoor room analysis.

Your task is to analyze a photo of an indoor room and identify all paintable wall surfaces with SEMANTIC NAMES.

WALL IDENTIFICATION RULES:
1. Analyze the room context and furniture to give each wall a descriptive name
2. Names should describe WHAT IS ON OR NEAR the wall, not just position
3. Use patterns like:
   - "Wall with TV" / "Wall with television" - if there's a TV
   - "Window Wall" / "Wall with window" - if there's a window
   - "Wall behind sofa" / "Sofa wall" - if sofa is visible
   - "Wall with door" / "Door wall" - if there's a door
   - "Kitchen wall" / "Wall with cabinets" - if kitchen elements
   - "Bare wall" / "Empty wall" - if no notable features
   - "Feature wall" / "Accent wall" - if different from others
   - "Left wall" / "Right wall" / "Back wall" / "Front wall" - as fallback

4. ALWAYS identify between 3-6 main walls (typical room has 4 walls)
5. If room has visible ceiling or floor that could be painted, include those too

OUTPUT FORMAT (JSON only):
{
  "walls": [
    {
      "id": "wall_1",
      "label": "Descriptive name in English",
      "description": "Optional brief description of what's on this wall"
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