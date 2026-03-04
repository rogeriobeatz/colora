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

    const autoLogin = async () => {
      try {
        setStatus("loading");

        // 🔧 CORREÇÃO: Redirecionamento direto baseado no origin
        console.log("[CheckoutSuccess] Iniciando redirecionamento:", { email, sessionId, mode, origin });
        
        // Esperar um pouco para o webhook processar
        await new Promise(r => setTimeout(r, 3000));
        
        // Detectar URL base dinamicamente
        const baseUrl = origin || window.location.origin;
        const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
        
        // Redirecionar diretamente para a dashboard com parâmetros de sucesso
        const redirectUrl = isLocalhost 
          ? `${baseUrl}/dashboard?payment=success&mode=${mode}&session_id=${sessionId}`
          : `https://colora.rogerio.work/dashboard?payment=success&mode=${mode}&session_id=${sessionId}`;
        
        setStatus("redirecting");
        console.log("[CheckoutSuccess] Redirecionando para:", redirectUrl);
        
        window.location.href = redirectUrl;
        return;
        
      } catch (err: any) {
        console.error("[CheckoutSuccess] Erro no redirecionamento:", err);
        setStatus("error");
        setErrorMsg("Erro ao redirecionar para a dashboard. Tente acessar manualmente.");
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
