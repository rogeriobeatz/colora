# Technical Deep Dive: Economy & Stripe Integration (Mission 2)

## 1. Arquitetura de Créditos (Token Ledger)
O Colora utiliza um sistema de "Double-Entry Ledger" simplificado para gerenciar os créditos de IA (Tokens). O saldo atual é mantido na tabela `profiles`, mas cada movimentação é obrigatoriamente registrada na tabela `token_consumptions`.

### Tabelas Envolvidas:
*   **`profiles.tokens`**: Saldo atual disponível.
*   **`token_consumptions`**: Histórico de depósitos (positivos) e gastos (negativos).
*   **`wall_cache`**: (Indiretamente) Economiza tokens ao evitar re-análise de imagens idênticas.

## 2. Fluxo de Pagamento (Stripe)

### A. Iniciação do Checkout (`create-checkout`)
1.  O frontend chama a Edge Function passando o `mode` (assinatura ou recarga).
2.  A função valida ou cria um `Stripe Customer`.
3.  Cria uma `Checkout Session` com metadados:
    *   `is_recharge`: Boolean para identificar pacotes avulsos.
    *   `create_user_on_success`: Identifica se deve criar um novo perfil após o pagamento.

### B. Confirmação e Provisionamento
O provisionamento de tokens ocorre em duas frentes para garantir redundância:
1.  **Redirecionamento de Sucesso:** A página de sucesso chama `generate-auth-link`, que processa a sessão e credita os tokens iniciais.
2.  **Stripe Webhook (`stripe-webhook`):** 
    *   Monitora `invoice.paid` para renovações mensais automáticas (+200 tokens).
    *   Monitora `customer.subscription.deleted` para revogar acesso.

## 3. Estratégia de Idempotência
Para evitar créditos duplicados ou falhas de sincronismo, o sistema utiliza:
*   **`external_id`**: O ID da fatura (invoice) ou sessão do Stripe é salvo no registro de consumo.
*   **Unique Index**: Um índice único no PostgreSQL em `(source, external_id)` impede a inserção de dois créditos para a mesma transação.
*   **Busca por Descrição**: O webhook verifica se o ID da fatura já existe no histórico antes de tentar um novo update.

## 4. Ciclo de Vida do Token
1.  **Depósito:** Registro positivo (`+200`) via Stripe Webhook ou Checkout Success.
2.  **Expiração:** Campo `tokens_expires_at` (atualmente configurado para 100 dias nas migrações).
3.  **Consumo:** Registro negativo (`-1`) disparado pela Edge Function `paint-wall` após o sucesso da pintura fotorrealista.
4.  **Consulta:** O frontend lê o saldo em tempo real via `AuthContext`.

## 5. Regras de Negócio Críticas
*   **Análise de Cômodo:** Gratuita (0 tokens).
*   **Pintura de Parede:** 1 Token por imagem gerada.
*   **Assinatura Ativa:** Necessária para acessar o Dashboard e gerenciar catálogos.
*   **Recargas:** Permitem o uso do simulador mesmo se a assinatura base expirar (dependendo da configuração de RLS).
