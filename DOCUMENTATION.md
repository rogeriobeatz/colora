# Colora 🎨 - Documentação Master

## 1. Visão Geral e Objetivo
O **Colora** é uma plataforma SaaS (Software as a Service) B2B no modelo **White-Label**, focada em revolucionar a jornada de compra no setor de tintas e revestimentos. O objetivo é fornecer uma ferramenta de Inteligência Artificial fotorrealista que permite ao cliente final visualizar cores e texturas em seus próprios ambientes antes da compra.

---

## 2. O Problema que o Colora Resolve
### A "Paralisia da Decisão" no Varejo de Tintas
Pesquisas de mercado indicam que a escolha da cor é a etapa de maior atrito e ansiedade na jornada de reforma.
*   **Dificuldade de Visualização:** Leques de cores físicos são pequenos e não mostram como a luz e a sombra do ambiente real afetarão a percepção da cor.
*   **Custo do Erro:** Pintar uma parede e não gostar do resultado gera prejuízo financeiro e retrabalho, o que faz clientes hesitarem ou optarem pelo "branco básico" por segurança.
*   **Inexistência de Propostas Visuais:** Lojistas costumam entregar orçamentos puramente textuais, perdendo a oportunidade de encantar o cliente com o resultado estético.

### A Solução
O Colora resolve isso ao transformar o vendedor em um consultor estético, oferecendo simulações instantâneas que eliminam a dúvida e aceleram o fechamento da venda.

---

## 3. Público-Alvo
O Colora opera em um modelo B2B2C:

1.  **Lojas de Tintas (Independentes ou Franquias):** O principal cliente. Utilizam o simulador no balcão (tablet/desktop) para fechar vendas mais rápidas.
2.  **Fabricantes de Tintas:** Grandes marcas que desejam oferecer um simulador oficial em seus sites, integrado aos seus catálogos.
3.  **Arquitetos e Designers de Interiores:** Profissionais que precisam de uma ferramenta ágil para apresentar opções rápidas de cores sem a complexidade de um render 3D pesado.
4.  **Pintores Profissionais:** Usam a ferramenta para agregar valor ao seu serviço e ajudar o cliente na decisão.

---

## 4. Funcionalidades Principais
*   **Simulador IA Fotorrealista:** Pintura virtual que preserva iluminação, sombras e texturas.
*   **White-Label Customizável:** Lojistas configuram logo, cores, subdomínio e catálogos próprios.
*   **Análise Estrutural por IA:** Identificação automática de paredes, móveis e obstáculos.
*   **Gestão de Catálogos (CSV):** Importação de marcas e códigos de cores reais (Suvinil, Coral, etc.).
*   **PDF Comercial:** Geração automática de propostas visuais com o "Antes e Depois" e dados de contato da loja.
*   **Sistema de Créditos (Tokens):** Consumo de IA baseado em uso, com recargas e assinaturas via Stripe.

---

## 5. Stack Tecnológica
*   **Frontend:** React 18, TypeScript, Vite.
*   **Estilização:** Tailwind CSS (Arquitetura baseada em Design Tokens e Shadcn/UI).
*   **Tipografia:** Jost (Estética geométrica moderna).
*   **Backend:** Supabase (PostgreSQL para dados, Auth para autenticação).
*   **Edge Functions:** Deno (TypeScript) para processamento pesado e integração com IA.
*   **Infraestrutura de IA:** 
    *   **Gemini (Lovable API):** Para análise estrutural do cômodo.
    *   **Flux Kontext (via Kie.AI):** Para geração de imagens fotorrealistas.
*   **Pagamentos:** Stripe (Checkout, Assinaturas e Webhooks).

---

## 6. Ecossistema de Edge Functions
O backend é composto por funções serverless especializadas:
*   `analyze-room`: Recebe a imagem do usuário e usa IA para mapear as áreas que podem ser pintadas.
*   `paint-wall`: O coração do simulador. Cruza a imagem original com a cor selecionada e aplica a rede neural para o fotorrealismo.
*   `generate-auth-link`: Gerencia o pós-pagamento do Stripe, credita os tokens de IA no perfil e gera o link de acesso.
*   `stripe-webhook`: Sincroniza o status das assinaturas e renovações mensais.

---

## 7. Branding e Tom de Voz
### Identidade Visual
*   **Conceito:** Minimalista, fluido e tecnológico.
*   **Estética:** Uso de superfícies sólidas e limpas, bordas RGB (rainbow) ultrafinas que remetem a feixes de luz, e tipografia geométrica inspirada na clássica Futura.
*   **Paleta:** Baseada em tons de Slate (ardósia) e branco, com acentos em gradientes que representam o espectro cromático.

### Tom de Voz
*   **Sofisticado:** Linguagem que valoriza a harmonia e o design.
*   **Inspirador:** Foca na transformação do ambiente e na realização de sonhos.
*   **Confiável:** Transmite autoridade técnica e segurança nos dados.
*   **Minimalista:** Sem "gritar" com o usuário; comunica o essencial com elegância.

---

## 8. Segurança e Privacidade
*   **Criptografia:** SSL de ponta a ponta.
*   **Processamento de Pagamento:** 100% processado pelo Stripe (PCI Compliance).
*   **Privacidade:** Imagens enviadas para simulação são temporárias e protegidas por Row Level Security (RLS) no banco de dados.

---
*Documento atualizado em: 03 de Abril de 2026.*
