import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSvg from "@/assets/colora-logo.svg";
import { supabase } from "@/integrations/supabase/client";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const sessionId = searchParams.get("session_id") || "";
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!email || !sessionId) {
      setStatus("error");
      setErrorMsg("Parâmetros inválidos. Verifique o link.");
      return;
    }

    const autoLogin = async () => {
      try {
        setStatus("loading");

        // Wait a moment for webhook to process
        await new Promise(r => setTimeout(r, 3000 + retryCount * 2000));

        // Call edge function to get auto-login link (verified against Stripe)
        const { data, error } = await supabase.functions.invoke("generate-auth-link", {
          body: { email: decodeURIComponent(email), sessionId }
        });

        if (error || !data?.authLink) {
          throw new Error(data?.error || error?.message || "Não foi possível gerar o link de acesso");
        }

        setStatus("redirecting");
        // Navigate to the auth link — Supabase will process it and redirect to /dashboard
        window.location.href = data.authLink;
      } catch (err: any) {
        console.error("[CheckoutSuccess] Error:", err);
        if (retryCount < 3) {
          // Retry (webhook may not have processed yet)
          setRetryCount(prev => prev + 1);
        } else {
          setStatus("error");
          setErrorMsg(err.message || "Erro ao acessar a plataforma.");
        }
      }
    };

    autoLogin();
  }, [email, sessionId, retryCount]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link to="/">
          <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated text-center space-y-6">
          {status === "loading" || status === "redirecting" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  {status === "redirecting" ? "Redirecionando..." : "Pagamento confirmado!"}
                </h1>
                <p className="text-muted-foreground">
                  {status === "redirecting"
                    ? "Você será levado ao painel em instantes..."
                    : retryCount > 0
                      ? `Aguardando processamento... (tentativa ${retryCount + 1})`
                      : "Estamos preparando seu acesso à plataforma..."}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Houve um problema
                </h1>
                <p className="text-muted-foreground text-sm mb-4">{errorMsg}</p>
                <p className="text-muted-foreground text-xs mb-4">
                  Seu pagamento foi processado com sucesso. Você pode acessar a plataforma fazendo login com o e-mail{" "}
                  <strong>{decodeURIComponent(email)}</strong>.
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={() => setRetryCount(0)} variant="default" className="w-full">
                  Tentar novamente
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login">Ir para o login</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
