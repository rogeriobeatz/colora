import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ColoraSpinner } from "@/components/ui/colora-spinner";
import PublicLayout from "@/components/layouts/PublicLayout";

type Step = "info" | "credentials" | "login";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session) navigate("/dashboard");
  }, [session, navigate]);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { 
          data: { 
            full_name: fullName, 
            user_type: 'trial', 
            company_name: companyName, 
            company_slug: generateSlug(companyName) 
          } 
        }
      });
      if (signUpError) throw signUpError;
      toast.success("Conta criada com sucesso!", { 
        description: "Você ganhou 3 simulações grátis para testar o Colora!" 
      });
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
              <h2 className="text-2xl font-display font-bold text-foreground">Testar Gratuitamente</h2>
              <p className="text-sm text-muted-foreground mt-1">Ganhe 3 simulações grátis para conhecer o Colora</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa / Loja</Label>
                <Input id="companyName" placeholder="Ex: Tintas & Cores" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Seu Nome Completo</Label>
                <Input id="fullName" placeholder="Ex: João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" />
              </div>
              <Button className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700" disabled={!fullName || !companyName} onClick={() => setStep("credentials")}>Continuar</Button>
            </div>
          </div>
        );
      case "credentials":
        return (
          <form onSubmit={handleSignUp} className="space-y-6 animate-fade-in">
            <button type="button" onClick={() => setStep("info")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Para finalizar...</h2>
              <p className="text-sm text-muted-foreground mt-1">Crie suas credenciais de acesso</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <ColoraSpinner size="sm" /> : "Criar Conta e Testar Grátis"}
              </Button>
            </div>
          </form>
        );
      case "login":
        return (
          <form onSubmit={handleSignIn} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">Bem-vindo ao Colora</h2>
              <p className="text-sm text-muted-foreground mt-1">Acesse o painel da sua loja</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Senha</Label>
                  <button type="button" onClick={() => { if (!email) { toast.error("Digite seu e-mail primeiro"); return; } supabase.auth.resetPasswordForEmail(email); toast.info("Link de recuperação enviado para seu e-mail"); }} className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? <ColoraSpinner size="sm" /> : "Entrar no Painel"}
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
              </div>
              <Button type="button" variant="outline" className="w-full h-12 text-base border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2" onClick={() => setStep("info")}>
                <Sparkles className="w-4 h-4" /> Testar Gratuitamente
              </Button>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                Ganhe 3 simulações grátis, sem cartão de crédito
              </p>
            </div>
          </form>
        );
    }
  };

  return (
    <PublicLayout maxWidth="max-w-xl" showBackLink={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full">
          <div className="bg-card p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary opacity-50" />
            {renderStep()}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;
