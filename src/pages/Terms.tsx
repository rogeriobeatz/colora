import PublicLayout from "@/components/layouts/PublicLayout";

const Terms = () => {
  return (
    <PublicLayout>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Termos de Uso</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
          <p className="text-sm text-muted-foreground">
            Ao acessar e usar o Colora, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
          <p className="text-sm text-muted-foreground">
            O Colora é uma plataforma de simulação de cores baseada em inteligência artificial, destinada a lojas de tintas e profissionais do setor. 
            O serviço permite a visualização de cores em fotografias de ambientes reais.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Cadastro e Assinatura</h2>
          <p className="text-sm text-muted-foreground">
            Para utilizar as funcionalidades completas, é necessário realizar um cadastro e manter uma assinatura ativa. 
            Você é responsável por manter a confidencialidade de sua conta e senha.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Uso Permitido</h2>
          <p className="text-sm text-muted-foreground">
            O serviço deve ser utilizado para fins profissionais e comerciais legítimos. 
            É proibido o uso do sistema para processar imagens que violem direitos de terceiros ou contenham conteúdo impróprio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Limitações de Responsabilidade</h2>
          <p className="text-sm text-muted-foreground">
            As simulações de cores são representações digitais e podem variar dependendo da iluminação, qualidade da foto e calibração do monitor. 
            Recomendamos sempre o teste físico da tinta antes da aplicação final.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Cancelamento</h2>
          <p className="text-sm text-muted-foreground">
            A assinatura pode ser cancelada a qualquer momento através do painel do cliente ou entrando em contato com nosso suporte. 
            O acesso permanecerá ativo até o final do período já pago.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">7. Alterações nos Termos</h2>
          <p className="text-sm text-muted-foreground">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            Alterações significativas serão comunicadas aos usuários através do e-mail cadastrado ou avisos na plataforma.
          </p>
        </section>

        <p className="text-xs text-muted-foreground/60 mt-8">
          Última atualização: 27 de fevereiro de 2026.
        </p>
      </div>
    </PublicLayout>
  );
};

export default Terms;
