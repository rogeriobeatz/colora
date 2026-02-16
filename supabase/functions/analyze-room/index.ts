import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Use Gemini vision to analyze the room and identify wall regions
    const systemPrompt = `You are a room analysis AI. Given a photo of a room, identify distinct paintable wall surfaces.

For each wall surface you detect, return a polygon defined by percentage-based coordinates (0-100 for both x and y, where 0,0 is top-left).

IMPORTANT RULES:
- Only identify actual wall surfaces (not furniture, windows, doors, floor, or ceiling unless it's a paintable surface)
- Each wall should have 4-8 polygon points that trace its visible outline
- Give each wall a descriptive Portuguese label like "Parede Esquerda", "Parede Central", "Parede do Fundo", "Teto"
- Return between 2 and 6 surfaces
- Be precise with the polygon coordinates to match the actual wall boundaries in the image
- Account for furniture, windows, and doors that occlude parts of walls

Return ONLY valid JSON in this exact format, no other text:
{
  "walls": [
    {
      "label": "Parede Esquerda",
      "polygon": [{"x": 0, "y": 15}, {"x": 30, "y": 12}, {"x": 30, "y": 85}, {"x": 0, "y": 90}]
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
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Analyze this room photo. Identify all visible paintable wall surfaces and return their polygon coordinates as JSON.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from the response (handle markdown code blocks)
    let wallsData;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      wallsData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Try to find JSON object directly
      const directMatch = content.match(/\{[\s\S]*\}/);
      if (directMatch) {
        wallsData = JSON.parse(directMatch[0]);
      } else {
        throw new Error("Could not parse wall detection response");
      }
    }

    // Validate and normalize the response
    const walls = (wallsData.walls || []).map((wall: any, index: number) => ({
      id: `wall_${index}_${Date.now()}`,
      label: wall.label || `Parede ${index + 1}`,
      polygon: (wall.polygon || []).map((p: any) => ({
        x: Math.max(0, Math.min(100, Number(p.x) || 0)),
        y: Math.max(0, Math.min(100, Number(p.y) || 0)),
      })),
    }));

    console.log(`Detected ${walls.length} walls`);

    return new Response(
      JSON.stringify({ walls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-room error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
