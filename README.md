# Colora 🎨

Plataforma white-label para simulação de pintura de ambientes com Inteligência Artificial.

## 📄 Sobre o Projeto

Colora é uma aplicação de software como serviço (SaaS) B2B, projetada para empresas de tintas ou design de interiores. O objetivo principal é fornecer uma ferramenta de **white-label** que essas empresas podem personalizar com sua própria marca e oferecer a seus clientes finais.

A plataforma permite que os usuários (os clientes das empresas) façam o upload de uma foto de seu ambiente e, através de Inteligência Artificial, apliquem virtualmente cores de um catálogo nas paredes, obtendo uma simulação realista do resultado final antes de qualquer compra ou trabalho de pintura.

## ✨ Funcionalidades Principais

-   **Simulação de Pintura com IA**: Faça o upload de uma foto de um cômodo e nossa IA identifica as paredes e aplica a cor selecionada de forma realista.
-   **Customização de Marca (White-Label)**: Clientes B2B podem configurar a aparência da aplicação com seu próprio logotipo, nome e esquema de cores.
-   **Catálogo de Cores Interativo**: Usuários podem explorar e selecionar cores de um catálogo para testar em suas paredes.
-   **Persistência de Sessão**: As simulações e projetos dos usuários são salvos automaticamente no navegador, permitindo que eles retomem o trabalho a qualquer momento.

## 🚀 Stack de Tecnologia

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
-   **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
-   **Linguagem das Edge Functions**: Deno (TypeScript)
-   **Serviços de IA**: Modelos de Machine Learning hospedados na plataforma [Replicate](https://replicate.com/) para análise e pintura de imagens.

## ⚙️ Como Executar o Projeto Localmente

1.  **Clone o Repositório**
    ```sh
    git clone <URL_DO_SEU_REPOSITORIO>
    cd colora
    ```

2.  **Instale as Dependências**
    ```sh
    npm install
    ```

3.  **Configure as Variáveis de Ambiente**
    -   Crie um arquivo `.env` na raiz do projeto.
    -   Adicione suas chaves de API do Supabase (URL e Anon Key) e outras variáveis necessárias.

4.  **Inicie o Servidor de Desenvolvimento**
    ```sh
    npm run dev
    ```

O servidor local estará disponível em `http://localhost:5173`.
