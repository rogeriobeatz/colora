import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ColoraSpinner } from "@/components/ui/colora-spinner";
import PublicLayout from "@/components/layouts/PublicLayout";

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

  const getHashParams = () => {
    const hash = location.hash;
    const params = new URLSearchParams(hash.substring(1));
    return { access_token: params.get("access_token"), refresh_token: params.get("refresh_token"), type: params.get("type") };
  };

  const { access_token, type } = getHashParams();
  const token = access_token;

  useEffect(() => {
    if (!token || type !== "recovery") { setStatus("error"); setErrorMsg("Link de recuperação inválido ou expirado."); return; }
    const verifyToken = async () => {
      try {
        if (access_token) {
          const { error } = await supabase.auth.getUser(access_token);
          setStatus(error ? "error" : "ready");
          if (error) setErrorMsg("Link de recuperação inválido ou expirado.");
        } else { setStatus("error"); setErrorMsg("Token de recuperação não encontrado."); }
      } catch { setStatus("error"); setErrorMsg("Link de recuperação inválido ou expirado."); }
    };
    verifyToken();
  }, [token, type, access_token]);

  const validatePassword = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++; if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++; if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { isValid: false, strength: "weak" as const };
    if (score <= 4) return { isValid: true, strength: "medium" as const };
    return { isValid: true, strength: "strong" as const };
  };

  const handlePasswordChange = (value: string) => { setPassword(value); setPasswordStrength(validatePassword(value).strength); };

  const strengthColor = passwordStrength === "weak" ? "text-destructive" : passwordStrength === "medium" ? "text-accent-foreground" : "text-primary";
  const strengthText = passwordStrength === "weak" ? "Fraca" : passwordStrength === "medium" ? "Média" : "Forte";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    if (!validatePassword(password).isValid) { toast.error("Senha muito fraca"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("success");
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      toast.error("Erro ao redefinir senha", { description: error.message });
    } finally { setLoading(false); }
  };

  const renderContent = () => {
    if (status === "loading") return (
      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center space-y-6">
        <ColoraSpinner size="lg" className="mx-auto" />
        <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
      </div>
    );
    if (status === "error") return (
      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Link Inválido</h2>
          <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full"><a href="/login">Voltar para o Login</a></Button>
          <Button variant="outline" asChild className="w-full"><a href="/login">Solicitar Novo Link</a></Button>
        </div>
      </div>
    );
    if (status === "success") return (
      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Senha Redefinida!</h2>
          <p className="text-sm text-muted-foreground">Você será redirecionado para o login em instantes...</p>
        </div>
      </div>
    );
    return (
      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Redefinir Senha</h2>
          <p className="text-sm text-muted-foreground">Crie sua nova senha de acesso</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => handlePasswordChange(e.target.value)} className="h-12 pl-10 pr-10" required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && passwordStrength && <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Força:</span><span className={strengthColor}>{strengthText}</span></div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirme sua senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pl-10 pr-10" required minLength={8} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && <p className="text-xs text-destructive">As senhas não coincidem</p>}
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Requisitos de senha:</p>
            <ul className="space-y-1"><li>• Mínimo 8 caracteres</li><li>• Letras maiúsculas e minúsculas</li><li>• Pelo menos um número</li><li>• Caracteres especiais (recomendado)</li></ul>
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading || !password || !confirmPassword || password !== confirmPassword}>
            {loading ? <><ColoraSpinner size="sm" className="mr-2" /> Redefinindo...</> : "Redefinir Senha"}
          </Button>
        </form>
        <div className="text-center mt-6"><a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Voltar para o Login</a></div>
      </div>
    );
  };

  return (
    <PublicLayout maxWidth="max-w-md" showBackLink={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {renderContent()}
      </div>
    </PublicLayout>
  );
};

export default ResetPassword;
