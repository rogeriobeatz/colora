import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColoraSpinner } from "@/components/ui/colora-spinner";
import logoSvg from "@/assets/colora-logo.svg";
import { supabase } from "@/integrations/supabase/client";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const sessionId = searchParams.get("session_id") || "";
  const mode = searchParams.get("mode") || "";
  const origin = searchParams.get("origin") || "";
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!email || !sessionId) {
      setStatus("error");
      setErrorMsg("Parâmetros inválidos. Verifique o link.");
      return;
    }

    let cancelled = false;

    const autoLogin = async () => {
      try {
        setStatus("loading");
        console.log("[CheckoutSuccess] Iniciando auto-login:", { email, sessionId, mode, origin, attempt: retryCount + 1 });

        // Wait for webhook to process (longer on first try)
        const delay = retryCount === 0 ? 4000 : 2000;
        await new Promise(r => setTimeout(r, delay));
        if (cancelled) return;

        // Call generate-auth-link to get a programmatic auth link
        console.log("[CheckoutSuccess] Chamando generate-auth-link...");
        const { data, error } = await supabase.functions.invoke("generate-auth-link", {
          body: { email: decodeURIComponent(email), sessionId },
        });

        if (error) {
          console.error("[CheckoutSuccess] Erro na function:", error);
          throw new Error(error.message || "Erro ao gerar link de autenticação");
        }

        if (!data?.authLink) {
          console.error("[CheckoutSuccess] Resposta sem authLink:", data);
          throw new Error(data?.error || "Link de autenticação não gerado");
        }

        console.log("[CheckoutSuccess] Auth link recebido, redirecionando...");
        
        if (cancelled) return;
        setStatus("redirecting");

        // Redirect to the auth link which will authenticate and redirect to dashboard
        window.location.href = data.authLink;
        
      } catch (err: any) {
        console.error("[CheckoutSuccess] Erro:", err);
        if (cancelled) return;
        
        // Auto-retry up to 3 times
        if (retryCount < 3) {
          console.log(`[CheckoutSuccess] Tentando novamente (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          return;
        }
        
        setStatus("error");
        setErrorMsg(err.message || "Erro ao autenticar. Tente fazer login manualmente.");
      }
    };

    autoLogin();
    return () => { cancelled = true; };
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
                <ColoraSpinner size="lg" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  {status === "redirecting" ? "Redirecionando..." : "Pagamento confirmado!"}
                </h1>
                <p className="text-muted-foreground">
                  {status === "redirecting"
                    ? "Você será levado ao painel em instantes..."
                    : retryCount > 0
                      ? `Aguardando processamento... (tentativa ${retryCount + 1}/4)`
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
