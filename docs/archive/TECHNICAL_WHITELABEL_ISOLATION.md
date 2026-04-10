# Technical Deep Dive: White-Labeling & B2B Isolation (Mission 3)

## 1. Arquitetura de Branding Dinâmico
O Colora utiliza uma abordagem de "Runtime Theme Generation". Em vez de arquivos CSS estáticos para cada cliente, a identidade visual é construída dinamicamente no navegador.

### O Componente `BrandingApplier.tsx`
Este componente é o responsável por transformar dados do banco em interface. Ele monitora o `StoreContext` e aplica as seguintes transformações no `:root` do DOM:
*   **Cores HSL:** Converte HEX para HSL para permitir manipulação de opacidade via Tailwind (ex: `bg-primary/50`).
*   **WCAG Auto-Contrast:** Calcula a luminância para definir `--primary-foreground`. Se um cliente escolher um Amarelo limão como cor primária, o sistema forçará o texto dos botões para preto automaticamente para manter a acessibilidade AA.
*   **Font Stacking:** Altera a variável `--font-sans` e `--font-display` globalmente, trocando a personalidade da interface (Grotesk, Rounded ou Neo).

## 2. Estratégia de Multi-Tenancy
O sistema é um SaaS Multi-tenant compartilhado onde o isolamento ocorre via **Row Level Security (RLS)** no PostgreSQL.

### Camadas de Isolamento:
1.  **Isolamento de Gestão:** Tabelas como `catalogs`, `paints` e `profiles` possuem políticas que exigem `auth.uid() == owner_id` para qualquer alteração.
2.  **Isolamento de Consumo:** As sessões de simulação (`simulator_sessions`) são vinculadas ao `user_id`, garantindo privacidade para o cliente final e para o lojista.
3.  **Acesso Público (Read-Only):** O simulador público acessa os dados via `slug`. As políticas de RLS permitem `SELECT` público apenas para catálogos e tintas, protegendo informações sensíveis como tokens e faturamento.

## 3. Gestão de Contexto (`StoreContext`)
O `StoreContext` atua como a única fonte de verdade para a identidade do tenant ativo.
*   **Cache:** Utiliza `localStorage` (`colora_company_cache`) para evitar latência visual no carregamento inicial.
*   **Sync:** Realiza buscas paralelas (`Promise.all`) para perfil e catálogos para minimizar o tempo de carregamento do Dashboard.

## 4. Segurança de Storage
*   **Bucket `images`:** Configurado com políticas de RLS onde usuários só podem ler/escrever em seus próprios "pastas" virtuais baseadas em seu `auth.uid()`, impedindo o acesso não autorizado a fotos de ambientes de terceiros.

## 5. Pontos de Atenção
*   **Acessibilidade:** Sempre que adicionar um novo componente de UI, utilize as variáveis CSS de foreground (`--primary-foreground`, `--header-fg`) para garantir que o contraste dinâmico funcione.
*   **RLS Bypass:** Nunca utilize o `service_role_key` no frontend, pois ele ignora as políticas de isolamento aqui descritas.
