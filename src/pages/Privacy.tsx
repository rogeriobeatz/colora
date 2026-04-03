import PublicLayout from "@/components/layouts/PublicLayout";

const Privacy = () => {
  return (
    <PublicLayout>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Política de Privacidade</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Coleta de Informações</h2>
          <p className="text-sm text-muted-foreground">
            Ao se cadastrar no Colora, coletamos informações essenciais para a prestação do serviço, como nome, e-mail, telefone, nome da empresa e dados de faturamento (CPF/CNPJ). 
            Também processamos as imagens que você envia para simulação de cores.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Uso das Informações</h2>
          <p className="text-sm text-muted-foreground">As informações coletadas são utilizadas para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Fornecer e gerenciar seu acesso ao simulador.</li>
            <li>Processar pagamentos e emitir notas fiscais.</li>
            <li>Enviar atualizações sobre o serviço e suporte técnico.</li>
            <li>Personalizar a experiência do white-label com sua marca.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Proteção de Dados</h2>
          <p className="text-sm text-muted-foreground">
            Adotamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acessos não autorizados, perda ou alteração. 
            Os dados de pagamento são processados de forma segura pelo Stripe, e não armazenamos informações completas de cartões de crédito em nossos servidores.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Compartilhamento de Dados</h2>
          <p className="text-sm text-muted-foreground">
            Não vendemos nem alugamos seus dados pessoais a terceiros. 
            Compartilhamos informações apenas com parceiros necessários para a operação do serviço, como processadores de pagamento e provedores de infraestrutura em nuvem, sempre sob rigorosos contratos de confidencialidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Seus Direitos</h2>
          <p className="text-sm text-muted-foreground">
            De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem o direito de acessar, corrigir, excluir ou solicitar a portabilidade de seus dados pessoais a qualquer momento. 
            Basta entrar em contato através de nossos canais de suporte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Cookies</h2>
          <p className="text-sm text-muted-foreground">
            Utilizamos cookies para manter sua sessão ativa e melhorar a navegação no site. 
            Você pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento de algumas partes do serviço.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">7. Contato</h2>
          <p className="text-sm text-muted-foreground">
            Para qualquer dúvida sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato pelo e-mail: suporte@colora.com.br
          </p>
        </section>

        <p className="text-xs text-muted-foreground/60 mt-8">
          Última atualização: 27 de fevereiro de 2026.
        </p>
      </div>
    </PublicLayout>
  );
};

export default Privacy;
