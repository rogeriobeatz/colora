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
    const { imageBase64, paintColor, wallLabel } = await req.json();

    if (!imageBase64 || !paintColor) {
      throw new Error("Imagem e Cor são obrigatórias");
    }

    // Configurações de Ambiente
    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KIE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Variáveis de ambiente não configuradas (KIE ou Supabase)");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- PASSO 1: Upload da Imagem para o Supabase Storage ---
    // A API do Kie exige uma URL pública, não aceita Base64 direto.
    console.log("1. Fazendo upload da imagem...");
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await supabase.storage
      .from('images') // CERTIFIQUE-SE QUE ESTE BUCKET EXISTE E É PÚBLICO
      .upload(fileName, buffer, { contentType: 'image/png' });

    if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log("   Imagem acessível em:", publicUrl);

    // --- PASSO 2: Preparar Prompt e Payload ---
    const superficie = wallLabel || "wall";
    
    // Prompt focado em Inpainting/Recolorização
    const prompt = `Repaint ONLY the ${superficie} with the color ${paintColor}. Keep all furniture, shadows, lighting, and textures exactly the same. High quality, photorealistic, interior design photography.`;

    const payload = {
      model: "flux-2/pro-image-to-image", // Modelo correto segundo sua doc
      input: {
        input_urls: [publicUrl], // Array com a URL gerada
        prompt: prompt,
        aspect_ratio: "auto",
        resolution: "1K"
      }
    };

    // --- PASSO 3: Criar Tarefa no Kie.ai ---
    console.log("2. Enviando para Kie.ai...");
    
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
      throw new Error(`Erro Kie Create (${createRes.status}): ${err}`);
    }

    const createData = await createRes.json();
    if (createData.code !== 200) throw new Error(`Erro API Kie: ${createData.msg}`);
    
    const taskId = createData.data.taskId;
    console.log("   Task criada ID:", taskId);

    // --- PASSO 4: Polling (Aguardar Resultado) ---
    console.log("3. Aguardando processamento...");
    const finalImageUrl = await pollKieTask(taskId, KIE_API_KEY);

    return new Response(
      JSON.stringify({ imageUrl: finalImageUrl, sucesso: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("ERRO FATAL:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, sucesso: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar de Polling corrigida para a estrutura do Kie
async function pollKieTask(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 30; // ~60 segundos
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000)); // Espera 2s

    const res = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!res.ok) continue;

    const body = await res.json();
    const data = body.data;

    if (data.state === "success") {
      // O Kie retorna o resultado como STRING JSON dentro de resultJson
      try {
        const resultObj = JSON.parse(data.resultJson);
        return resultObj.resultUrls[0];
      } catch (e) {
        throw new Error("Erro ao ler JSON de resposta do Kie");
      }
    }

    if (data.state === "fail") {
      throw new Error(`Kie falhou: ${data.failMsg}`);
    }
  }
  throw new Error("Timeout: A imagem demorou muito para gerar.");
}