# Plano de Correção de Segurança - Colora

Este plano visa resolver as vulnerabilidades de segurança identificadas no relatório do Lovable, priorizando a integridade financeira (tokens) e a privacidade dos dados.

## 1. Proteção de Tokens e Dados Sensíveis (Tabela `profiles`)
**Problema:** Usuários podem atualizar seus próprios tokens via RLS.
**Ação:**
- Implementar uma Trigger `protect_sensitive_profile_fields` que impede a alteração de colunas críticas (`tokens`, `stripe_customer_id`, `subscription_status`, `account_type`) por usuários que não sejam `service_role`.
- Criar uma view ou limitar o `SELECT` para evitar exposição desnecessária de IDs internos do Stripe.

## 2. Integridade do Histórico de Tokens (`token_consumptions`)
**Problema:** Usuários podem inserir registros de consumo manualmente.
**Ação:**
- Remover a política de `INSERT` para usuários autenticados.
- Garantir que apenas Edge Functions (usando `service_role`) possam registrar consumos.

## 3. Segurança de Armazenamento (Storage)
**Problema:** Bucket `images` é público.
**Ação:**
- Alterar o bucket para `public = false`.
- Atualizar as políticas de RLS para permitir leitura apenas ao dono da imagem.

## 4. Robustez das Edge Functions
**Problema:** Falta de validação e exposição de erros.
**Ação:**
- Adicionar validação de entrada nas funções `paint-wall` e `analyze-room`.
- Implementar tratamento de erro genérico para o cliente, com logs detalhados apenas no servidor.

## 5. Auditoria de Catálogos e Tintas
**Problema:** Possível acesso de escrita por usuários não autenticados.
**Ação:**
- Revisar `GRANT` e políticas de RLS para garantir que `anon` só tenha acesso a `SELECT` em catálogos ativos.

## Cronograma de Execução:
1. **Fase 1 (Imediata):** Correção do RLS de `profiles` e `token_consumptions`.
2. **Fase 2:** Alteração de visibilidade do Storage.
3. **Fase 3:** Refatoração das Edge Functions.
4. **Fase 4:** Verificação geral e limpeza de funções SECURITY DEFINER obsoletas.
