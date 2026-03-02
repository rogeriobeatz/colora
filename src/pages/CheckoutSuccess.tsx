import { Link, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSvg from "@/assets/colora-logo.svg";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link to="/">
          <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Pagamento confirmado!
            </h1>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium">
              Verifique seu e-mail
            </p>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de acesso para{" "}
              {email ? (
                <strong className="text-foreground">{decodeURIComponent(email)}</strong>
              ) : (
                "seu e-mail"
              )}
              . Clique no link para acessar o painel da sua loja.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Não recebeu? Verifique a pasta de spam ou aguarde alguns minutos.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login">
                Já tenho acesso, ir para o login <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
