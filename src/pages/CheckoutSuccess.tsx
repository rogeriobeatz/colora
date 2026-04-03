import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColoraSpinner } from "@/components/ui/colora-spinner";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/layouts/PublicLayout";

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
    if (!email || !sessionId) { setStatus("error"); setErrorMsg("Parâmetros inválidos."); return; }
    let cancelled = false;
    const autoLogin = async () => {
      try {
        setStatus("loading");
        await new Promise(r => setTimeout(r, retryCount === 0 ? 4000 : 2000));
        if (cancelled) return;
        const { data, error } = await supabase.functions.invoke("generate-auth-link", { body: { email: decodeURIComponent(email), sessionId } });
        if (error) throw new Error(error.message || "Erro ao gerar link");
        if (!data?.authLink) throw new Error(data?.error || "Link não gerado");
        if (cancelled) return;
        setStatus("redirecting");
        window.location.href = data.authLink;
      } catch (err: any) {
        if (cancelled) return;
        if (retryCount < 3) { setRetryCount(prev => prev + 1); return; }
        setStatus("error");
        setErrorMsg(err.message || "Erro ao autenticar.");
      }
    };
    autoLogin();
    return () => { cancelled = true; };
  }, [email, sessionId, retryCount]);

  return (
    <PublicLayout maxWidth="max-w-md" showBackLink={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center space-y-6 w-full">
          {status === "loading" || status === "redirecting" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><ColoraSpinner size="lg" /></div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">{status === "redirecting" ? "Redirecionando..." : "Pagamento confirmado!"}</h2>
                <p className="text-sm text-muted-foreground">{status === "redirecting" ? "Você será levado ao painel em instantes..." : retryCount > 0 ? `Aguardando processamento... (tentativa ${retryCount + 1}/4)` : "Estamos preparando seu acesso..."}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"><AlertCircle className="w-8 h-8 text-destructive" /></div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Houve um problema</h2>
                <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
                <p className="text-xs text-muted-foreground mb-4">Seu pagamento foi processado. Faça login com <strong>{decodeURIComponent(email)}</strong>.</p>
              </div>
              <div className="space-y-3">
                <Button onClick={() => setRetryCount(0)} className="w-full">Tentar novamente</Button>
                <Button variant="outline" asChild className="w-full"><Link to="/login">Ir para o login</Link></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default CheckoutSuccess;
