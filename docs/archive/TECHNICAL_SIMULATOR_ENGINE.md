# Technical Deep Dive: Simulator Engine (Mission 1)

## 1. Visão Geral (Overview)
O motor do simulador do Colora é uma orquestração complexa entre o Frontend (React/Hooks), Armazenamento Local (IndexedDB), Supabase Storage e Edge Functions de IA. Ele é projetado para ser resiliente a falhas de conexão e econômico em termos de consumo de tokens de IA.

## 2. Ciclo de Vida da Simulação (Simulation Lifecycle)

### A. Upload e Pré-processamento
*   **Trigger:** Componente `UploadArea.tsx` -> `useSimulator.addRoom`.
*   **Processamento:** A imagem é convertida para Base64 e processada via `preprocessImageFile` para garantir dimensões otimizadas antes do envio.
*   **Persistência Inicial:** Criado um registro de "Room" no estado do `useSimulator` e salvo no `idb` (IndexedDB) via `simulator-db.ts`.

### B. Análise Estrutural (Analyze Room)
*   **Edge Function:** `analyze-room` (Deno/TypeScript).
*   **Modelo de IA:** `google/gemini-2.0-flash`.
*   **Lógica de Cache:**
    1.  Gera um `hash` curto da imagem original.
    2.  Consulta a tabela `wall_cache` no Supabase.
    3.  Se **HIT**: Retorna as superfícies detectadas instantaneamente (0 tokens consumidos).
    4.  Se **MISS**: Chama a API do Gemini, faz o parsing do JSON, salva no `wall_cache` e retorna (0 tokens consumidos - análise é gratuita).
*   **Resultado:** Um array de paredes com nomes em português para a UI e descrições técnicas em inglês para a IA de pintura.

### C. Pintura Fotorrealista (Paint Wall)
*   **Edge Function:** `paint-wall` (Deno/TypeScript).
*   **Modelo de IA:** `flux-2/pro-image-to-image` (via Kie.AI).
*   **Consumo de Créditos:** **1 Token** debitado da tabela `profiles` e registrado em `token_consumptions` após o sucesso da geração.
*   **Fluxo Técnico:**
    1.  Recebe `imageBase64` + `paintColor` (Hex) + `wallLabelEn`.
    2.  Faz o upload da imagem para o bucket `images` do Supabase para gerar uma URL pública temporária (exigência da Kie.AI).
    3.  Inicia um job assíncrono na Kie.AI.
    4.  Executa um loop de *polling* (até 90s) aguardando o processamento.
    5.  Retorna a URL final da imagem pintada.

### D. Empilhamento de Simulações (State Stacking)
*   O `useSimulator` permite pintar múltiplas paredes sequencialmente.
*   Ao aplicar uma nova cor, o hook verifica se há uma simulação ativa (`activeSimulationId`).
*   Se existir, ele envia a imagem já pintada como base para a próxima chamada da IA, permitindo que o usuário visualize o ambiente inteiro com cores diferentes em cada parede.

## 3. Estrutura de Dados e Persistência
*   **Local DB (`idb`):** Armazena o estado completo da sessão (`SimulatorSessionData`), permitindo que o usuário feche o navegador e retome o projeto exatamente onde parou.
*   **Supabase Storage:** Bucket `images` atua como cache temporário para as APIs de IA.
*   **Tabela `wall_cache`:** Centraliza o conhecimento sobre ambientes já analisados para reduzir latência e custos de API.

## 4. Pontos de Atenção para Manutenção
*   **Políticas de RLS:** A tabela `wall_cache` é pública para leitura, mas restrita para escrita via `service_role`.
*   **Timeout de Polling:** Atualmente em 90 segundos. Se a API de IA estiver lenta, o frontend pode disparar um erro de timeout.
*   **Gestão de Memória:** O uso extensivo de Base64 no estado do React pode causar lentidão em dispositivos móveis com muitas salas abertas simultaneamente.
