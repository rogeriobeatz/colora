import { Link } from "react-router-dom";
import logoSvg from "@/assets/colora-logo.svg";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSvg} alt="Logotipo Colora" className="w-32" />
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar para home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Termos de Uso</h1>
        
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o Colora, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
            <p>
              O Colora é uma plataforma de simulação de cores baseada em inteligência artificial, destinada a lojas de tintas e profissionais do setor. 
              O serviço permite a visualização de cores em fotografias de ambientes reais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Cadastro e Assinatura</h2>
            <p>
              Para utilizar as funcionalidades completas, é necessário realizar um cadastro e manter uma assinatura ativa. 
              Você é responsável por manter a confidencialidade de sua conta e senha.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Uso Permitido</h2>
            <p>
              O serviço deve ser utilizado para fins profissionais e comerciais legítimos. 
              É proibido o uso do sistema para processar imagens que violem direitos de terceiros ou contenham conteúdo impróprio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Limitações de Responsabilidade</h2>
            <p>
              As simulações de cores são representações digitais e podem variar dependendo da iluminação, qualidade da foto e calibração do monitor. 
              Recomendamos sempre o teste físico da tinta antes da aplicação final.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Cancelamento</h2>
            <p>
              A assinatura pode ser cancelada a qualquer momento através do painel do cliente ou entrando em contato com nosso suporte. 
              O acesso permanecerá ativo até o final do período já pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas aos usuários através do e-mail cadastrado ou avisos na plataforma.
            </p>
          </section>

          <p className="text-sm mt-8">
            Última atualização: 27 de fevereiro de 2026.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
