import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logoSvg from "@/assets/colora-logo.svg";

type Step = "info" | "credentials" | "login";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
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
      // 1. Criar usuário no Supabase Auth
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: 'company',
            company_name: companyName,
            company_slug: generateSlug(companyName),
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // 2. Criar perfil na tabela profiles com saldo zerado
      if (data.user?.id) {
        console.log('[CADASTRO] Dados recebidos:', {
          fullName,
          companyName,
          email
        });

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            company_name: companyName, // CORRIGIDO: Usar companyName
            company_slug: generateSlug(companyName),
            tokens: 0, // Saldo zerado
            ai_credits: 0, // Créditos zerados
            subscription_status: 'inactive', // Sem assinatura
            document_type: 'cpf',
            document_number: '',
            stripe_customer_id: null,
            needs_password: false // Já definiu senha no cadastro
          });

        console.log('[CADASTRO] Perfil criado:', { profileError, success: !profileError });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw new Error('Erro ao criar perfil. Tente novamente.');
        }
      }
      
      toast.success("Conta criada com sucesso!", {
        description: "Sua conta foi criada com saldo zerado. Assine um plano para obter tokens.",
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
      case "info":
        return (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setStep("login")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Criar Conta Gratuita</h2>
              <p className="text-muted-foreground text-sm mt-1">Cadastre sua empresa e comece a usar o Colora</p>
            </div>
            <div className="space-y-4">
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
              <Button 
                className="w-full h-12 text-base shadow-soft" 
                disabled={!fullName || !companyName}
                onClick={() => setStep("credentials")}
              >
                Continuar
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
                <Label htmlFor="email">E-mail Corporativo</Label>
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
              <Button type="submit" className="w-full h-12 text-base shadow-soft" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Criar Conta Gratuita"}
              </Button>
            </div>
          </form>
        );

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
                  Quer tokens? <span className="font-bold">Assine um plano</span>
                </Link>
                <div className="mt-2">
                  <Link 
                    to="#" 
                    onClick={() => setStep("info")}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Ou <span className="font-bold">crie conta gratuita</span>
                  </Link>
                </div>
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
