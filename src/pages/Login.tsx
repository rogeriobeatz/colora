import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Store, User, ArrowRight, ArrowLeft, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

type Step = "type" | "info" | "credentials" | "login";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>("type");
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [userType, setUserType] = useState<'company' | 'customer'>('customer');
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            company_name: userType === 'company' ? companyName : fullName,
            company_slug: userType === 'company' ? generateSlug(companyName) : generateSlug(fullName),
          }
        }
      });

      if (error) throw error;
      
      toast.success("Conta criada com sucesso!", {
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });
      setStep("login");
    } catch (error: any) {
      toast.error("Erro ao criar conta", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

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

  const renderStep = () => {
    switch (step) {
      case "type":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">Como você quer usar o Colora?</h2>
              <p className="text-muted-foreground text-sm mt-1">Escolha o perfil que melhor te descreve</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setUserType('customer'); setStep("info"); }}
                className="p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-4 text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <span className="block text-base font-bold">Sou Cliente</span>
                  <span className="text-xs text-muted-foreground">Quero simular cores para minha casa ou projeto</span>
                </div>
              </button>
              <button
                onClick={() => { setUserType('company'); setStep("info"); }}
                className="p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-4 text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Store className="w-7 h-7" />
                </div>
                <div>
                  <span className="block text-base font-bold">Sou Loja / Empresa</span>
                  <span className="text-xs text-muted-foreground">Quero oferecer o simulador para meus clientes</span>
                </div>
              </button>
            </div>
            <div className="text-center pt-4">
              <button onClick={() => setStep("login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Já tem uma conta? <span className="font-bold">Entrar agora</span>
              </button>
            </div>
          </div>
        );

      case "info":
        return (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setStep("type")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Conte-nos um pouco mais</h2>
              <p className="text-muted-foreground text-sm mt-1">Precisamos de algumas informações básicas</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Seu Nome Completo</Label>
                <Input 
                  id="fullName" 
                  placeholder="Ex: João Silva" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12"
                />
              </div>
              {userType === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa / Loja</Label>
                  <Input 
                    id="companyName" 
                    placeholder="Ex: Tintas & Cores" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12"
                  />
                </div>
              )}
              <Button 
                className="w-full h-12 text-base shadow-soft" 
                disabled={!fullName || (userType === 'company' && !companyName)}
                onClick={() => setStep("credentials")}
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "credentials":
        return (
          <form onSubmit={handleSignUp} className="space-y-6 animate-fade-in">
            <button onClick={() => setStep("info")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Para finalizar...</h2>
              <p className="text-muted-foreground text-sm mt-1">Crie suas credenciais de acesso</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
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
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base shadow-soft" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Criar Minha Conta"}
              </Button>
            </div>
          </form>
        );

      case "login":
        return (
          <form onSubmit={handleSignIn} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">Bem-vindo de volta</h2>
              <p className="text-muted-foreground text-sm mt-1">Acesse sua conta para continuar</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Senha</Label>
                  <button type="button" className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
                </div>
                <Input 
                  id="login-password" 
                  type="password" 
                  placeholder="Sua senha" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base shadow-soft" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Entrar"}
              </Button>
              <div className="text-center pt-4">
                <button type="button" onClick={() => setStep("type")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Não tem uma conta? <span className="font-bold">Cadastre-se grátis</span>
                </button>
              </div>
            </div>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link to="/" className="flex items-center gap-2 justify-center mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Colora</span>
        </Link>
      </div>

      <div className="w-full max-w-xl">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary opacity-50" />
          {renderStep()}
        </div>
      </div>
      
      <Link to="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
        ← Voltar para a página inicial
      </Link>
    </div>
  );
};

export default Login;