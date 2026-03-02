import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import logoSvg from "@/assets/colora-logo.svg";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  // Extrair parâmetros do hash (Supabase usa # para auth)
  const getHashParams = () => {
    const hash = location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove o #
    return {
      access_token: params.get("access_token"),
      refresh_token: params.get("refresh_token"),
      type: params.get("type")
    };
  };

  const { access_token, refresh_token, type } = getHashParams();
  const token = access_token;

  useEffect(() => {
    if (!token || type !== "recovery") {
      setStatus("error");
      setErrorMsg("Link de recuperação inválido ou expirado.");
      return;
    }
    
    // Verify token validity
    const verifyToken = async () => {
      try {
        // Para recovery tokens, precisamos usar o access_token do hash
        if (access_token) {
          const { error } = await supabase.auth.getUser(access_token);
          if (error) {
            setStatus("error");
            setErrorMsg("Link de recuperação inválido ou expirado.");
          } else {
            setStatus("ready");
          }
        } else {
          setStatus("error");
          setErrorMsg("Token de recuperação não encontrado.");
        }
      } catch (error) {
        setStatus("error");
        setErrorMsg("Link de recuperação inválido ou expirado.");
      }
    };

    verifyToken();
  }, [token, type, access_token]);

  const validatePassword = (password: string): { isValid: boolean; strength: "weak" | "medium" | "strong" } => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { isValid: false, strength: "weak" };
    if (score <= 4) return { isValid: true, strength: "medium" };
    return { isValid: true, strength: "strong" };
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordStrength(validation.strength);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "strong": return "text-green-500";
      default: return "text-gray-400";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case "weak": return "Fraca";
      case "medium": return "Média";
      case "strong": return "Forte";
      default: return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast.error("A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setStatus("success");
      toast.success("Senha redefinida com sucesso!");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erro ao redefinir senha", { 
        description: error.message || "Tente novamente ou solicite um novo link de recuperação." 
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
        </div>
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated text-center space-y-6">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Verificando link de recuperação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
        </div>
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Link Inválido
              </h1>
              <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a href="/login">Voltar para o Login</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/login">Solicitar Novo Link</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
        </div>
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Senha Redefinida!
              </h1>
              <p className="text-muted-foreground text-sm">
                Você será redirecionado para o login em instantes...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img src={logoSvg} alt="Colora" className="h-12 w-auto" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-elevated">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Redefinir Senha
            </h1>
            <p className="text-muted-foreground text-sm">
              Crie sua nova senha de acesso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mínimo 8 caracteres" 
                  value={password} 
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="h-12 pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && passwordStrength && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Força:</span>
                  <span className={getPasswordStrengthColor()}>{getPasswordStrengthText()}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirme sua senha" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Requisitos de senha:</p>
              <ul className="space-y-1">
                <li>• Mínimo 8 caracteres</li>
                <li>• Letras maiúsculas e minúsculas</li>
                <li>• Pelo menos um número</li>
                <li>• Caracteres especiais (recomendado)</li>
              </ul>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading || !password || !confirmPassword || password !== confirmPassword}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Redefinindo Senha...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Voltar para o Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
