import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KIE_BASE_URL = "https://api.kie.ai";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, paintColor, paintName, wallLabel } = await req.json();

    if (!imageBase64 || !paintColor) {
      return new Response(
        JSON.stringify({ error: "imageBase64 and paintColor are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    if (!KIE_API_KEY) {
      throw new Error("KIE_API_KEY is not configured");
    }

    // Build the editing prompt
    const prompt = `Repaint the ${wallLabel || "wall"} in this room with the color ${paintColor} (${paintName || "paint color"}). Keep the exact same room, furniture, lighting, and perspective. Only change the wall color to the specified color. Make it look photorealistic with proper lighting and shadows on the new wall color. Do not change anything else in the image.`;

    // Submit the image editing task to Kie.AI Flux Kontext
    const generateResponse = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        inputImage: imageBase64.startsWith("data:")
          ? imageBase64
          : `data:image/jpeg;base64,${imageBase64}`,
        model: "flux-kontext-pro",
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Kie.AI generate error:", generateResponse.status, errorText);

      if (generateResponse.status === 401) {
        throw new Error("Invalid Kie.AI API key");
      }
      if (generateResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kie.AI credits exhausted. Please add credits to your Kie.AI account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (generateResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Kie.AI rate limit. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Kie.AI API error [${generateResponse.status}]: ${errorText}`);
    }

    const generateData = await generateResponse.json();
    const taskId = generateData.data?.task_id || generateData.data?.taskId;

    if (!taskId) {
      console.error("No taskId returned:", JSON.stringify(generateData));
      throw new Error("No taskId returned from Kie.AI");
    }

    console.log(`Kie.AI task created: ${taskId}`);

    // Poll for completion (max 120 seconds)
    const maxWait = 120_000;
    const pollInterval = 3_000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `${KIE_BASE_URL}/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${KIE_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("Status check error:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      const taskData = statusData.data;

      if (!taskData) continue;

      const state = taskData.state;

      // State 3 = GENERATE_FAILED
      if (state === 3 || state === "GENERATE_FAILED" || state === "failed") {
        throw new Error(`Image generation failed: ${taskData.failMsg || "Unknown reason"}`);
      }

      // Check for completion - state could be numeric or string
      if (
        state === 2 ||
        state === "completed" ||
        state === "COMPLETED" ||
        state === "success"
      ) {
        // Extract the result image URL
        let resultUrl = null;

        if (taskData.resultJson) {
          try {
            const resultJson =
              typeof taskData.resultJson === "string"
                ? JSON.parse(taskData.resultJson)
                : taskData.resultJson;
            resultUrl = resultJson.imageUrl || resultJson.image_url || resultJson.url;

            // Handle array of images
            if (!resultUrl && Array.isArray(resultJson.images) && resultJson.images.length > 0) {
              resultUrl = resultJson.images[0].url || resultJson.images[0];
            }
          } catch {
            console.error("Failed to parse resultJson:", taskData.resultJson);
          }
        }

        // Try other possible fields
        if (!resultUrl) {
          resultUrl =
            taskData.imageUrl ||
            taskData.image_url ||
            taskData.outputUrl ||
            taskData.output_url;
        }

        if (resultUrl) {
          console.log(`Task ${taskId} completed. Result URL obtained.`);
          return new Response(
            JSON.stringify({ imageUrl: resultUrl, taskId }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If completed but no URL, log for debugging
        console.log("Task completed but no URL found in:", JSON.stringify(taskData));
        throw new Error("Task completed but no result image URL found");
      }

      console.log(`Task ${taskId} state: ${state}, waiting...`);
    }

    throw new Error("Task timed out after 120 seconds");
  } catch (error) {
    console.error("paint-wall error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
