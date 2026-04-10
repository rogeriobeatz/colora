# Colora - Global Architecture Document

## 1. Visão Geral do Sistema (System Overview)
O Colora é uma plataforma SaaS B2B "White-Label" que fornece simulações fotorrealistas de pintura de ambientes baseadas em IA. A arquitetura é dividida em um Frontend reativo (Single Page Application) e um Backend serverless (Supabase), que atua como orquestrador entre o banco de dados e os serviços de Inteligência Artificial de terceiros.

## 2. Arquitetura de Frontend (Client-Side)
*   **Core:** React 18, Vite e TypeScript.
*   **Roteamento:** React Router v6 gerenciando páginas públicas, painel de controle (Dashboard) e o Simulador.
*   **Estilização e UI:** 
    *   Tailwind CSS como motor principal.
    *   Componentes baseados em `shadcn/ui` (Acessibilidade + Design System).
    *   **White-Labeling Dinâmico:** O componente `BrandingApplier.tsx` intercepta as configurações da empresa (recebidas via contexto) e injeta variáveis CSS nativas (`--primary`, `--background`) no root da aplicação para alterar a identidade visual em tempo real.
*   **Gerenciamento de Estado:**
    *   **Global/Negócio:** `StoreContext` gerencia o estado do lojista atual (branding, catálogos ativos).
    *   **Server State:** TanStack Query (v5) gerencia cache, revalidação e sincronismo com o Supabase.
    *   **Feature State:** Hooks dedicados, com destaque para o `useSimulator.ts`, que controla a máquina de estados complexa da tela de simulação (Upload -> Análise -> Pintura -> Resultado).
    *   **Persistência Local:** Uso de `idb` (IndexedDB via `simulator-db.ts`) para salvar progresso offline e cache de imagens.

## 3. Arquitetura de Backend (Supabase Ecosystem)
A plataforma não possui um servidor Node.js tradicional ativo; ela se baseia integralmente no ecossistema Supabase.
*   **Banco de Dados (PostgreSQL):**
    *   Isolamento (Multi-tenant) garantido via **Row Level Security (RLS)**.
    *   Tabelas chave: `profiles`, `companies`, `catalogs`, `token_consumptions` e `wall_cache`.
*   **Autenticação:** Supabase Auth controlando acesso a rotas privadas.
*   **Storage:** Buckets do Supabase armazenam imagens originais dos usuários, máscaras de segmentação e resultados renderizados.
*   **Edge Functions (Serverless / Deno / TypeScript):**
    *   `analyze-room`: Função crítica que se comunica com a IA para detectar paredes, móveis e gerar a máscara de pintura.
    *   `paint-wall`: O motor de renderização. Pega a imagem base + máscara + cor HEX e envia para a IA geradora.
    *   `check-subscription` / `create-checkout` / `customer-portal` / `stripe-webhook`: Microsserviços para lidar com a economia da plataforma (pagamentos e liberação de créditos de IA).

## 4. Serviços de IA e Terceiros
*   **Gemini (via Lovable API):** Utilizado primariamente para a "Visão Computacional" (análise estrutural do cômodo).
*   **Flux Kontext (via Kie.AI):** Rede neural generativa responsável pelo "fotorrealismo" final (preservação de luz, sombra e textura ao aplicar a nova cor).
*   **Stripe:** Motor de faturamento, assinaturas mensais e recarga de pacotes de tokens.

## 5. Fluxos Críticos de Negócio
1.  **Fluxo de Identidade (White-Label):** Acesso à URL -> Detecção do Lojista -> `StoreContext` -> `BrandingApplier` injeta CSS -> UI renderiza com a cara do cliente.
2.  **Fluxo de Simulação (Motor IA):** 
    *   Upload -> Salvo no Supabase Storage.
    *   Frontend chama a Edge Function `analyze-room` (Consome Token).
    *   Usuário seleciona cor do catálogo -> Frontend chama a Edge Function `paint-wall` (Consome Token).
    *   Resultado salvo no `wall_cache` e retornado ao usuário.
3.  **Fluxo de Economia (Tokens):** Toda ação de IA passa por validação de saldo no Supabase. O gatilho de sucesso debita a tabela `token_consumptions`.
