import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Palette } from "lucide-react";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link to="/" className="flex items-center gap-2 justify-center mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Colora</span>
        </Link>
        <h1 className="text-xl font-display font-semibold text-foreground">Área da Loja</h1>
        <p className="text-muted-foreground text-sm">Entre ou crie sua conta para gerenciar seus catálogos</p>
      </div>

      <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-elevated">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(168 72% 32%)',
                  brandAccent: 'hsl(168 72% 42%)',
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Criar conta',
                loading_button_label: 'Criando conta...',
                link_text: 'Não tem uma conta? Cadastre-se',
              },
            },
          }}
          theme="light"
          providers={[]}
        />
      </div>
      
      <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Voltar para a Home
      </Link>
    </div>
  );
};

export default Login;