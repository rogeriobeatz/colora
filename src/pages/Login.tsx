import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Palette, Store, User, ArrowRight } from "lucide-react";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'company' | 'customer'>('customer');

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <Link to="/" className="flex items-center gap-2 justify-center mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Colora</span>
        </Link>
        <h1 className="text-2xl font-display font-bold text-foreground">Comece sua jornada</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha seu perfil para personalizar sua experiência</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* User Type Selector */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setUserType('customer')}
            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
              userType === 'customer'
                ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-soft"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${userType === 'customer' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm font-bold">Sou Cliente</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Quero simular cores para minha casa</span>
            </div>
          </button>
          <button
            onClick={() => setUserType('company')}
            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
              userType === 'company'
                ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-soft"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${userType === 'company' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm font-bold">Sou Loja</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Quero oferecer simulador aos meus clientes</span>
            </div>
          </button>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-50" />
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(168 72% 32%)',
                    brandAccent: 'hsl(168 72% 42%)',
                    inputBackground: 'transparent',
                    inputText: 'inherit',
                    inputPlaceholder: 'hsl(var(--muted-foreground))',
                  },
                  radii: {
                    borderRadiusButton: '0.75rem',
                    buttonPadding: '0.75rem',
                    inputPadding: '0.75rem',
                  }
                },
              },
              className: {
                button: 'font-semibold shadow-soft hover:shadow-none transition-all',
                input: 'border-border focus:border-primary transition-all',
              }
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar agora',
                  loading_button_label: 'Autenticando...',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Já tem uma conta? Entre aqui',
                },
                sign_up: {
                  email_label: 'Seu melhor e-mail',
                  password_label: 'Crie uma senha forte',
                  button_label: 'Criar minha conta',
                  loading_button_label: 'Preparando seu espaço...',
                  link_text: 'Não tem uma conta? Cadastre-se grátis',
                },
              },
            }}
            theme="light"
            providers={[]}
            additionalData={{
              user_type: userType,
              company_name: userType === 'company' ? 'Minha Loja' : 'Meu Espaço'
            }}
          />
        </div>
      </div>
      
      <Link to="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
        ← Voltar para a página inicial
      </Link>
    </div>
  );
};

export default Login;