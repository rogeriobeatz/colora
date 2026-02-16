import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KIE_BASE_URL = "https://api.kie.ai";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, paintColor, paintName, wallLabel, surfaceType } = await req.json();

    if (!imageBase64 || !paintColor) {
      return new Response(
        JSON.stringify({ error: "imageBase64 e paintColor são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    if (!KIE_API_KEY) {
      console.error("[paint-wall] KIE_API_KEY não configurada");
      throw new Error("KIE_API_KEY não está configurada");
    }

    // Formatar imagem base64
    const formattedImage = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Determinar o tipo de superfície para o prompt
    const tipoSuperficie = (surfaceType || "parede").toLowerCase();
    const nomeSuperficie = wallLabel || "parede";
    
    // Prompt otimizado para o Flux Kontext - mais direto e específico
    const prompt = `Repaint the ${nomeSuperficie} in this indoor room with the exact color ${paintColor}. 

IMPORTANT REQUIREMENTS:
- Only change the color of the ${nomeSuperficie}, keep EVERYTHING else identical
- Do NOT add, remove, or modify any furniture, objects, windows, doors, or decorations
- Maintain the exact same lighting, shadows, and perspective
- The new paint color should look realistic with proper lighting adaptation
- Keep the room structure completely unchanged
- The ${nomeSuperficie} should have a natural, professional paint finish

This is a real photo, make it look photorealistic.`;

    console.log("[paint-wall] Enviando requisição para Kie.AI com cor:", paintColor, "superfície:", nomeSuperficie);

    // Enviar tarefa para o Flux Kontext
    const generateResponse = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        inputImage: formattedImage,
        model: "flux-kontext-pro",
        quality: "high",
        aspect_ratio: "auto",
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("[paint-wall] Erro na API Kie.AI:", generateResponse.status, errorText);

      if (generateResponse.status === 401) {
        throw new Error("Chave de API Kie.AI inválida");
      }
      if (generateResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos do Kie.AI esgotados. Por favor, adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (generateResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (generateResponse.status === 400) {
        // Tentar com modelo alternativo
        console.log("[paint-wall] Tentando com modelo alternativo...");
        const fallbackResponse = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${KIE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            inputImage: formattedImage,
            model: "flux-kontext",
          }),
        });
        
        if (!fallbackResponse.ok) {
          const fallbackError = await fallbackResponse.text();
          throw new Error(`Erro ao gerar imagem: ${fallbackError}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        const taskId = fallbackData.data?.task_id || fallbackData.data?.taskId;
        
        if (!taskId) {
          throw new Error("Não foi possível iniciar a geração de imagem");
        }
        
        console.log("[paint-wall] Tarefa criada (fallback):", taskId);
        
        // Polling para o fallback
        const imageUrl = await pollForResult(KIE_API_KEY, taskId);
        
        return new Response(
          JSON.stringify({ 
            imageUrl: imageUrl, 
            taskId: taskId,
            sucesso: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Erro na API de geração: ${errorText}`);
    }

    const generateData = await generateResponse.json();
    const taskId = generateData.data?.task_id || generateData.data?.taskId;

    if (!taskId) {
      console.error("[paint-wall] Nenhum taskId retornado:", JSON.stringify(generateData));
      throw new Error("Não foi possível iniciar a geração de imagem");
    }

    console.log("[paint-wall] Tarefa criada:", taskId);

    // Polling para obter o resultado
    const imageUrl = await pollForResult(KIE_API_KEY, taskId);

    console.log("[paint-wall] Imagem gerada com sucesso:", imageUrl);

    return new Response(
      JSON.stringify({ 
        imageUrl: imageUrl, 
        taskId: taskId,
        sucesso: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[paint-wall] Erro fatal:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        sucesso: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função de polling para esperar o resultado
async function pollForResult(apiKey: string, taskId: string): Promise<string> {
  const maxWait = 180000; // 3 minutos
  const pollInterval = 3000; // 3 segundos
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    try {
      const statusResponse = await fetch(
        `${KIE_BASE_URL}/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.log("[paint-wall] Erro ao verificar status:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      const taskData = statusData.data;

      if (!taskData) {
        console.log("[paint-wall] Dados da tarefa vazios");
        continue;
      }

      const state = taskData.state;

      // Estado de falha
      if (state === 3 || state === "GENERATE_FAILED" || state === "failed" || state === "FAILED") {
        const failMsg = taskData.failMsg || taskData.fail_message || "Motivo desconhecido";
        throw new Error(`Falha na geração de imagem: ${failMsg}`);
      }

      // Estados de sucesso
      const successStates = [2, "completed", "COMPLETED", "success", "SUCCESS"];
      if (successStates.includes(state)) {
        // Tentar múltiplos campos para a URL da imagem
        let resultUrl = null;

        // 1. Tentar resultJson.parseado
        if (taskData.resultJson) {
          try {
            const resultJson = typeof taskData.resultJson === "string"
              ? JSON.parse(taskData.resultJson)
              : taskData.resultJson;
            
            resultUrl = resultJson.imageUrl || 
                       resultJson.image_url || 
                       resultJson.url || 
                       resultJson.output_url;
            
            // Array de imagens
            if (!resultUrl && Array.isArray(resultJson.images) && resultJson.images.length > 0) {
              resultUrl = resultJson.images[0].url || resultJson.images[0];
            }
            // Array de outputs
            if (!resultUrl && Array.isArray(resultJson.outputs) && resultJson.outputs.length > 0) {
              resultUrl = resultJson.outputs[0].url || resultJson.outputs[0].image_url;
            }
          } catch {
            console.log("[paint-wall] Erro ao parsear resultJson");
          }
        }

        // 2. Tentar campos diretos
        if (!resultUrl) {
          resultUrl = taskData.imageUrl || 
                     taskData.image_url || 
                     taskData.outputUrl || 
                     taskData.output_url ||
                     taskData.url;
        }

        // 3. Tentar último recurso - parsing de string
        if (!resultUrl && typeof taskData.resultJson === "string") {
          const urlMatch = taskData.resultJson.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
          if (urlMatch) {
            resultUrl = urlMatch[1];
          }
        }

        if (resultUrl) {
          console.log("[paint-wall] URL da imagem obtida:", resultUrl);
          return resultUrl;
        }

        console.log("[paint-wall] Estado de sucesso mas sem URL:", JSON.stringify(taskData).substring(0, 500));
        throw new Error("Tarefa concluída mas URL da imagem não encontrada");
      }

      console.log(`[paint-wall] Aguardando... Estado atual: ${state}`);
    } catch (pollError) {
      console.log("[paint-wall] Erro no polling:", pollError);
    }
  }

  throw new Error("Tempo limite excedido ao gerar imagem (3 minutos)");
}