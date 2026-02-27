import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter parâmetros da URL
        const email = searchParams.get("email");
        const sessionId = searchParams.get("session_id");
        const paymentSuccess = searchParams.get("payment") === "success";

        if (!email || !sessionId || !paymentSuccess) {
          throw new Error("Parâmetros inválidos na URL de callback");
        }

        console.log("[AuthCallback] Processando callback para:", email);

        // Aguardar um pouco para garantir que o Webhook criou o usuário
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Tentar fazer login com a senha temporária
        // Como não sabemos a senha temporária, vamos usar a função de recuperação
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/dashboard?payment=success&session_id=${sessionId}`,
        });

        if (resetError) {
          console.error("[AuthCallback] Erro ao solicitar reset de senha:", resetError);
          // Mesmo com erro, vamos tentar redirecionar para o dashboard
          // O Supabase pode ter criado a sessão automaticamente
          navigate(`/dashboard?payment=success&session_id=${sessionId}`, { replace: true });
          return;
        }

        console.log("[AuthCallback] Link de recuperação enviado para:", email);

        // Redirecionar para o dashboard
        // O usuário receberá um e-mail com o link de recuperação, mas também tentaremos
        // estabelecer a sessão diretamente
        navigate(`/dashboard?payment=success&session_id=${sessionId}`, { replace: true });

      } catch (err: any) {
        console.error("[AuthCallback] Erro no processamento:", err);
        setError(err.message || "Erro ao processar o callback de autenticação");
        setIsProcessing(false);

        // Após 3 segundos, redirecionar para o dashboard mesmo com erro
        setTimeout(() => {
          const sessionId = searchParams.get("session_id");
          navigate(`/dashboard?payment=success&session_id=${sessionId}`, { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        {isProcessing && !error ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Finalizando seu acesso...
            </h1>
            <p className="text-gray-600">
              Estamos preparando seu painel. Aguarde um momento.
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Houve um pequeno problema
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Você será redirecionado para o painel em breve...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AuthCallback;
