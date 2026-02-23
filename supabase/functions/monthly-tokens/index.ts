import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  status,
});

serve(async (req) => {
  // Apenas aceita requisições POST com chave secreta
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET_KEY");
  
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    console.log("[monthly-tokens] Iniciando depósito mensal de tokens...");
    
    // 1. Environment Validation
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    };

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Environment variables not configured");
      return jsonResponse({ error: "Internal server configuration error." }, 500);
    }
    
    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Buscar usuários com assinatura ativa
    const { data: activeUsers, error: usersError } = await serviceRoleClient
      .from('profiles')
      .select('id, tokens, last_token_deposit')
      .eq('subscription_status', 'active');

    if (usersError) {
      console.error("Erro ao buscar usuários ativos:", usersError);
      return jsonResponse({ error: "Failed to fetch active users" }, 500);
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log("[monthly-tokens] Nenhum usuário com assinatura ativa encontrado");
      return jsonResponse({ message: "No active users found", processed: 0 });
    }

    console.log(`[monthly-tokens] Encontrados ${activeUsers.length} usuários com assinatura ativa`);

    // 3. Processar cada usuário
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const expiresAt = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000); // 100 dias
    
    let processed = 0;
    let skipped = 0;

    for (const user of activeUsers) {
      try {
        // Verifica se já depositou este mês
        if (user.last_token_deposit?.startsWith(currentMonth)) {
          console.log(`[monthly-tokens] Usuário ${user.id} já recebeu tokens este mês`);
          skipped++;
          continue;
        }

        // Deposita tokens
        const newTokens = (user.tokens || 0) + 200;
        
        // Atualiza perfil
        const { error: updateError } = await serviceRoleClient
          .from('profiles')
          .update({
            tokens: newTokens,
            tokens_expires_at: expiresAt.toISOString(),
            last_token_deposit: now.toISOString().slice(0, 10)
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`[monthly-tokens] Erro ao atualizar usuário ${user.id}:`, updateError);
          continue;
        }

        // Registra consumo
        await serviceRoleClient
          .from('token_consumptions')
          .insert({
            user_id: user.id,
            amount: 200,
            description: "Depósito mensal de tokens"
          });

        console.log(`[monthly-tokens] 200 tokens depositados para usuário ${user.id}. Saldo: ${newTokens}`);
        processed++;

      } catch (error) {
        console.error(`[monthly-tokens] Erro ao processar usuário ${user.id}:`, error);
      }
    }

    console.log(`[monthly-tokens] Processamento concluído: ${processed} depositados, ${skipped} pulados`);

    return jsonResponse({
      message: "Monthly token deposit completed",
      processed,
      skipped,
      total: activeUsers.length,
      deposit_date: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });

  } catch (error: any) {
    console.error("[monthly-tokens] FATAL ERROR:", error.message);
    return jsonResponse({ error: error.message }, 500);
  }
});
