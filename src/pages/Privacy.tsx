import { Link } from "react-router-dom";
import logoSvg from "@/assets/colora-logo.svg";

const Privacy = () => {
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
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Coleta de Informações</h2>
            <p>
              Ao se cadastrar no Colora, coletamos informações essenciais para a prestação do serviço, como nome, e-mail, telefone, nome da empresa e dados de faturamento (CPF/CNPJ). 
              Também processamos as imagens que você envia para simulação de cores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Uso das Informações</h2>
            <p>
              As informações coletadas são utilizadas para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fornecer e gerenciar seu acesso ao simulador.</li>
              <li>Processar pagamentos e emitir notas fiscais.</li>
              <li>Enviar atualizações sobre o serviço e suporte técnico.</li>
              <li>Personalizar a experiência do white-label com sua marca.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Proteção de Dados</h2>
            <p>
              Adotamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acessos não autorizados, perda ou alteração. 
              Os dados de pagamento são processados de forma segura pelo Stripe, e não armazenamos informações completas de cartões de crédito em nossos servidores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos nem alugamos seus dados pessoais a terceiros. 
              Compartilhamos informações apenas com parceiros necessários para a operação do serviço, como processadores de pagamento e provedores de infraestrutura em nuvem, sempre sob rigorosos contratos de confidencialidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Seus Direitos</h2>
            <p>
              De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem o direito de acessar, corrigir, excluir ou solicitar a portabilidade de seus dados pessoais a qualquer momento. 
              Basta entrar em contato através de nossos canais de suporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies</h2>
            <p>
              Utilizamos cookies para manter sua sessão ativa e melhorar a navegação no site. 
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento de algumas partes do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Contato</h2>
            <p>
              Para qualquer dúvida sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato pelo e-mail: suporte@colora.com.br
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

export default Privacy;
