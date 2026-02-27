import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Store, ArrowRight, ArrowLeft, Loader2, Mail, Lock, Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import logoSvg from "@/assets/colora-logo.svg";

type Step = "login" | "set-password" | "success";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Se o usuário já estiver logado e não estiver no fluxo de definir senha, vai pro dashboard
    if (session && step !== "set-password") {
      navigate("/dashboard");
    }
  }, [session, navigate, step]);

  useEffect(() => {
    // Se vier do checkout com sucesso, incentiva a definição de senha ou login
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      setStep("set-password");
      toast.success("Pagamento confirmado!", {
        description: "Agora defina uma senha para acessar sua conta.",
      });
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Bem-vindo de volta!");
    } catch (error: any) {
      toast.error("Erro ao entrar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    
    try {
      // 1. Tentar fazer login com a senha temporária enviada por e-mail ou gerada no webhook
      // Mas como o usuário não sabe a senha temporária, o ideal é usar o fluxo de recuperação
      // ou se o usuário acabou de ser criado, ele pode ter recebido um link.
      
      // No nosso fluxo simplificado, vamos tentar o resetPasswordForEmail que envia um link
      // OU se o usuário já estiver logado (via link de confirmação), usamos updatePlayer
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        // Se já houver sessão (ex: veio de um link de confirmação auto-login)
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      } else {
        // Se não houver sessão, solicita link de recuperação
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?payment=success&email=${encodeURIComponent(email)}`,
        });
        if (error) throw error;
        
        toast.info("Link enviado!", {
          description: "Enviamos um link para seu e-mail para você definir sua senha com segurança."
        });
        return;
      }

      setStep("success");
      toast.success("Senha definida com sucesso!");
    } catch (error: any) {
      console.error("Erro ao definir senha:", error);
      toast.error("Erro ao definir senha", { 
        description: error.message.includes("sub claim") 
          ? "Sua sessão expirou. Por favor, solicite um novo link de acesso." 
          : error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "login":
        return (
          <form onSubmit={handleSignIn} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">Bem-vindo ao Colora</h2>
              <p className="text-muted-foreground text-sm mt-1">Acesse o painel da sua loja</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Senha</Label>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!email) {
                        toast.error("Digite seu e-mail primeiro");
                        return;
                      }
                      supabase.auth.resetPasswordForEmail(email);
                      toast.info("Link de recuperação enviado para seu e-mail");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="login-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Sua senha" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base shadow-soft" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Entrar no Painel"}
              </Button>
              <div className="text-center pt-4">
                <Link to="/checkout" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Ainda não tem conta? <span className="font-bold">Assine e cadastre sua loja</span>
                </Link>
              </div>
            </div>
          </form>
        );

      case "set-password":
        return (
          <form onSubmit={handleSetPassword} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">Defina sua Senha</h2>
              <p className="text-muted-foreground text-sm mt-1">Crie uma senha para acessar seu painel</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="set-email">E-mail de Acesso</Label>
                <Input id="set-email" value={email} disabled className="h-12 bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="new-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="confirm-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Repita a senha" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-10 pr-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base shadow-soft" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Salvar Senha e Entrar"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Se você não recebeu o link de confirmação, <button type="button" onClick={() => setStep("login")} className="text-primary hover:underline">tente fazer login</button> ou recupere sua senha.
              </p>
            </div>
          </form>
        );

      case "success":
        return (
          <div className="text-center py-8 space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Tudo pronto!</h2>
              <p className="text-muted-foreground mt-2">Sua senha foi definida com sucesso.</p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full h-12 text-base">
              Ir para o Painel <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link to="/" className="flex items-center gap-2 justify-center mb-4">
          <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
        </Link>
      </div>

      <div className="w-full max-w-xl">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary opacity-50" />
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Login;
