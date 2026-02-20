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
    const { imageBase64, paintColor, wallLabel, wallLabelEn, cropCoordinates } = await req.json();

    if (!imageBase64 || !paintColor) {
      throw new Error("Image and Color are required");
    }

    // Technical Wall Name: English > Portuguese > "wall"
    const technicalWallName = wallLabelEn || wallLabel || "wall";

    // Environment
    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KIE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // STEP 0: Apply crop if coordinates are provided
    let processedImageBase64 = imageBase64;
    
    if (cropCoordinates) {
      console.log("Applying crop coordinates:", cropCoordinates);
      
      // Decode base64 to get image dimensions
      const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create image to get dimensions
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = `data:image/jpeg;base64,${base64Data}`;
      });

      const { width: origW, height: origH } = img;
      
      // Calculate crop region (cropCoordinates are in percentages: 0-100)
      const cropX = (cropCoordinates.x / 100) * origW;
      const cropY = (cropCoordinates.y / 100) * origH;
      const cropW = (cropCoordinates.width / 100) * origW;
      const cropH = (cropCoordinates.height / 100) * origH;

      console.log(`Cropping: ${cropW}x${cropH} at (${cropX}, ${cropY}) from ${origW}x${origH}`);

      // Create canvas to crop
      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to create canvas context");

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      
      processedImageBase64 = canvas.toDataURL("image/jpeg", 0.92);
      console.log("Crop applied successfully");
    }

    // STEP 1: Upload processed image to Supabase
    console.log(`Uploading: ${technicalWallName} → ${paintColor}`);
    
    const finalBase64Data = processedImageBase64.replace(/^data:image\/[^;]+;base64,/, "");
    const buffer = Uint8Array.from(atob(finalBase64Data), c => c.charCodeAt(0));
    const fileName = `input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, { contentType: 'image/png' });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log("Image URL:", publicUrl);

    // STEP 2: Detect aspect ratio from processed image (16:9 or 2:3)
    const img = new Image();
    img.src = publicUrl;
    await new Promise(resolve => img.onload = resolve);

    const isLandscapeImage = img.width >= img.height;
    const aspectRatio = isLandscapeImage ? "16:9" : "2:3";

    // STEP 3: Optimized prompt + Kie payload
    const prompt = `Change ONLY the **${technicalWallName}** color to "${paintColor}". 

**KEEP EXACTLY UNCHANGED:**
- ALL people, faces, clothing, poses
- animals and pets 
- furniture positions and shapes
- shadows and lighting direction  
- floor, ceiling, other walls
- textures and materials
- camera angle and perspective

Photorealistic interior design photography, professional lighting, high resolution.`;

    const payload = {
      model: "flux-2/pro-image-to-image",
      input: {
        input_urls: [publicUrl],
        prompt: prompt,
        aspect_ratio: aspectRatio,
        resolution: "1K"
      }
    };

    console.log("Kie payload:", { aspectRatio, prompt: prompt.slice(0, 100) + "..." });

    // STEP 4: Create Kie Task
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
    console.log("Task ID:", taskId);

    // STEP 5: Poll for result
    const finalImageUrl = await pollKieTask(taskId, KIE_API_KEY);

    // Cleanup: delete temp image after 1h (optional)
    setTimeout(async () => {
      await supabase.storage.from('images').remove([fileName]);
    }, 3600000);

    return new Response(
      JSON.stringify({ 
        imageUrl: finalImageUrl, 
        sucesso: true,
        details: { aspectRatio, wallName: technicalWallName }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, sucesso: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Polling helper (unchanged)
async function pollKieTask(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 30;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!res.ok) continue;

    const body = await res.json();
    const data = body.data;

    if (data.state === "success") {
      const resultObj = JSON.parse(data.resultJson);
      return resultObj.resultUrls[0];
    }

    if (data.state === "fail") {
      throw new Error(`Kie failed: ${data.failMsg}`);
    }
  }
  throw new Error("Timeout: Processing took too long.");
}