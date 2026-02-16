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

    // Formatar imagem base64 - garantir formato correto
    let formattedImage = imageBase64;
    if (!imageBase64.startsWith("data:")) {
      formattedImage = `data:image/jpeg;base64,${imageBase64}`;
    }

    // Determinar o tipo de superfície para o prompt
    const nomeSuperficie = wallLabel || "wall";
    const tipoSuperficie = (surfaceType || "parede").toLowerCase();
    
    // Prompt otimizado para o Flux Kontext
    const prompt = `Repaint the ${nomeSuperficie} in this indoor room with the exact color ${paintColor}. 

IMPORTANT REQUIREMENTS:
- Only change the color of the ${nomeSuperficie}, keep EVERYTHING else identical
- Do NOT add, remove, or modify any furniture, objects, windows, doors, or decorations
- Maintain the exact same lighting, shadows, and perspective
- The new paint color should look realistic with proper lighting adaptation
- Keep the room structure completely unchanged
- The ${nomeSuperficie} should have a natural, professional paint finish
- This is a real photo, make it look photorealistic`;

    console.log("[paint-wall] Enviando requisição para Kie.AI...");
    console.log("[paint-wall] Cor:", paintColor, "Superfície:", nomeSuperficie);

    // Tentar primeiro com o endpoint de geração direta (sem polling)
    // O Flux Kontext Pro pode ter um endpoint diferente
    const models = ["flux-kontext-pro", "flux-kontext", "flux-pro-1.1"];
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[paint-wall] Tentando com modelo: ${model}`);
        
        const generateResponse = await fetch(`${KIE_BASE_URL}/v1/images/generations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${KIE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            image_url: formattedImage,
            num_images: 1,
            size: "auto",
            quality: "high",
          }),
        });

        if (generateResponse.ok) {
          const data = await generateResponse.json();
          console.log("[paint-wall] Resposta da API:", JSON.stringify(data).substring(0, 500));
          
          // Verificar diferentes formatos de resposta
          const imageUrl = data.data?.[0]?.url || 
                          data.images?.[0]?.url || 
                          data.image_url ||
                          data.url;

          if (imageUrl) {
            console.log("[paint-wall] Imagem gerada com sucesso:", imageUrl);
            return new Response(
              JSON.stringify({ 
                imageUrl: imageUrl, 
                sucesso: true,
                model: model
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          const errorText = await generateResponse.text();
          console.log(`[paint-wall] Erro com modelo ${model}:`, generateResponse.status, errorText);
          lastError = { status: generateResponse.status, message: errorText };
        }
      } catch (modelError) {
        console.log(`[paint-wall] Erro ao tentar modelo ${model}:`, modelError);
        lastError = modelError;
      }
    }

    // Se os endpoints diretos falharam, tentar o endpoint de task (com polling)
    console.log("[paint-wall] Tentando endpoint de task com polling...");
    
    const taskResponse = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, {
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
      }),
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      console.error("[paint-wall] Erro na API Kie.AI:", taskResponse.status, errorText);
      
      if (taskResponse.status === 401) {
        throw new Error("Chave de API Kie.AI inválida. Verifique a chave nas configurações.");
      }
      if (taskResponse.status === 402) {
        throw new Error("Créditos do Kie.AI esgotados. Adicione créditos à sua conta.");
      }
      if (taskResponse.status === 429) {
        throw new Error("Limite de requisições excedido. Aguarde e tente novamente.");
      }
      
      throw new Error(`Erro da API (${taskResponse.status}): ${errorText}`);
    }

    const taskData = await taskResponse.json();
    console.log("[paint-wall] Dados da task:", JSON.stringify(taskData).substring(0, 500));

    // Verificar diferentes formatos de resposta de task
    const taskId = taskData.task_id || 
                   taskData.data?.task_id || 
                   taskData.data?.taskId ||
                   taskData.id ||
                   taskData.taskId;

    if (!taskId) {
      console.error("[paint-wall] Nenhum taskId encontrado na resposta:", taskData);
      // Se não há taskId mas há uma URL direta, usar ela
      const directUrl = taskData.data?.url || 
                       taskData.url || 
                       taskData.image_url ||
                       taskData.data?.[0]?.url;
      
      if (directUrl) {
        return new Response(
          JSON.stringify({ 
            imageUrl: directUrl, 
            sucesso: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Não foi possível iniciar a geração. Resposta inválida da API.");
    }

    console.log("[paint-wall] Task ID:", taskId);

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
  const pollInterval = 5000; // 5 segundos
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    try {
      // Tentar diferentes endpoints de status
      const endpoints = [
        `${KIE_BASE_URL}/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        `${KIE_BASE_URL}/v1/tasks/${taskId}`,
        `${KIE_BASE_URL}/api/v1/tasks/${taskId}/status`,
      ];

      let statusData = null;
      
      for (const endpoint of endpoints) {
        try {
          const statusResponse = await fetch(endpoint, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

          if (statusResponse.ok) {
            statusData = await statusResponse.json();
            console.log(`[paint-wall] Status da task (${endpoint}):`, JSON.stringify(statusData).substring(0, 300));
            break;
          }
        } catch (e) {
          console.log(`[paint-wall] Endpoint não funcionou: ${endpoint}`);
        }
      }

      if (!statusData) {
        console.log("[paint-wall] Nenhum endpoint de status funcionou");
        continue;
      }

      // Normalizar os dados da task
      const taskData = statusData.data || statusData;
      const state = taskData.state || taskData.status || taskData.state_value;

      console.log("[paint-wall] Estado atual:", state);

      // Estados de falha
      const failureStates = [3, "failed", "FAILED", "GENERATE_FAILED", "error", "ERROR"];
      if (failureStates.includes(state)) {
        const failMsg = taskData.failMsg || 
                       taskData.fail_message || 
                       taskData.error || 
                       taskData.message ||
                       "Motivo desconhecido";
        throw new Error(`Falha na geração: ${failMsg}`);
      }

      // Estados de sucesso
      const successStates = [2, "completed", "COMPLETED", "success", "SUCCESS", "done"];
      if (successStates.includes(state)) {
        // Tentar múltiplos campos para a URL da imagem
        let resultUrl = null;

        // 1. Campo direto
        resultUrl = taskData.imageUrl || 
                   taskData.image_url || 
                   taskData.url ||
                   taskData.output_url ||
                   taskData.outputUrl;

        // 2. Array data
        if (!resultUrl && taskData.data) {
          if (Array.isArray(taskData.data)) {
            resultUrl = taskData.data[0]?.url || taskData.data[0];
          } else if (typeof taskData.data === 'object') {
            resultUrl = taskData.data.url || 
                       taskData.data.image_url || 
                       taskData.data.output_url;
          }
        }

        // 3. Array images
        if (!resultUrl && Array.isArray(taskData.images)) {
          resultUrl = taskData.images[0]?.url || taskData.images[0];
        }

        // 4. Array outputs
        if (!resultUrl && Array.isArray(taskData.outputs)) {
          resultUrl = taskData.outputs[0]?.url || 
                     taskData.outputs[0]?.image_url ||
                     taskData.outputs[0];
        }

        // 5. ResultJson
        if (!resultUrl && taskData.resultJson) {
          try {
            const resultJson = typeof taskData.resultJson === "string"
              ? JSON.parse(taskData.resultJson)
              : taskData.resultJson;
            resultUrl = resultJson?.url || resultJson?.image_url || resultJson?.output_url;
          } catch {}
        }

        if (resultUrl) {
          console.log("[paint-wall] URL da imagem obtida:", resultUrl);
          return resultUrl;
        }

        console.log("[paint-wall] Estado de sucesso mas sem URL:", JSON.stringify(taskData).substring(0, 500));
        throw new Error("Tarefa concluída mas URL da imagem não encontrada");
      }

      console.log(`[paint-wall] Aguardando... Estado: ${state}`);
    } catch (pollError) {
      console.log("[paint-wall] Erro no polling:", pollError);
    }
  }

  throw new Error("Tempo limite excedido ao gerar imagem (3 minutos)");
}