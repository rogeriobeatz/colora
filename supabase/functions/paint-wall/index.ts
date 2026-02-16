import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KIE_BASE_URL = "https://api.kie.ai";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- CHANGE 1: Accept wallLabelEn (English Name) ---
    const { imageBase64, paintColor, wallLabel, wallLabelEn } = await req.json();

    if (!imageBase64 || !paintColor) {
      throw new Error("Image and Color are required");
    }

    // --- CHANGE 2: Define Technical Name for AI ---
    // Priority: English Label (Best) > Portuguese Label (Fallback) > "wall" (Generic)
    const technicalWallName = wallLabelEn || wallLabel || "wall";

    // Environment Configuration
    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KIE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Environment variables not configured (KIE or Supabase)");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- STEP 1: Upload Image to Supabase Storage ---
    console.log(`1. Uploading image to process: ${technicalWallName} (${paintColor})...`);
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await supabase.storage
      .from('images') // ENSURE THIS BUCKET EXISTS AND IS PUBLIC
      .upload(fileName, buffer, { contentType: 'image/png' });

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log("   Image accessible at:", publicUrl);

    // --- STEP 2: Prepare Prompt and Payload ---
    
    // --- CHANGE 3: Use technicalWallName in the prompt ---
    // Using **bold** helps the model focus on the subject
    const prompt = `Repaint ONLY the **${technicalWallName}** with the color ${paintColor}. Keep all furniture, shadows, lighting, and textures exactly the same. High quality, photorealistic, interior design photography.`;

    const payload = {
      model: "flux-2/pro-image-to-image",
      input: {
        input_urls: [publicUrl],
        prompt: prompt,
        aspect_ratio: "auto",
        resolution: "1K"
      }
    };

    // --- STEP 3: Create Task in Kie.ai ---
    console.log("2. Sending to Kie.ai with prompt:", prompt);
    
    const createRes = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Kie Create Error (${createRes.status}): ${err}`);
    }

    const createData = await createRes.json();
    if (createData.code !== 200) throw new Error(`Kie API Error: ${createData.msg}`);
    
    const taskId = createData.data.taskId;
    console.log("   Task created ID:", taskId);

    // --- STEP 4: Polling (Wait for Result) ---
    console.log("3. Waiting for processing...");
    const finalImageUrl = await pollKieTask(taskId, KIE_API_KEY);

    return new Response(
      JSON.stringify({ imageUrl: finalImageUrl, sucesso: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("FATAL ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, sucesso: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper Polling Function
async function pollKieTask(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 30; // ~60 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s

    const res = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!res.ok) continue;

    const body = await res.json();
    const data = body.data;

    if (data.state === "success") {
      try {
        const resultObj = JSON.parse(data.resultJson);
        return resultObj.resultUrls[0];
      } catch (e) {
        throw new Error("Error parsing Kie JSON response");
      }
    }

    if (data.state === "fail") {
      throw new Error(`Kie failed: ${data.failMsg}`);
    }
  }
  throw new Error("Timeout: Image generation took too long.");
}