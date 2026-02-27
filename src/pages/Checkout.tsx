import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Shield, CreditCard, User, Mail, Phone, Building2, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logoSvg from "@/assets/colora-logo.svg";
import { supabase } from "@/integrations/supabase/client";

const Checkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    document: "", // CNPJ ou CPF
    documentType: "cpf", // cpf ou cnpj
    acceptTerms: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateDocument = (doc: string, type: string) => {
    const cleanDoc = doc.replace(/\D/g, '');
    if (type === 'cpf') return cleanDoc.length === 11;
    if (type === 'cnpj') return cleanDoc.length === 14;
    return false;
  };

  const formatDocument = (doc: string, type: string) => {
    const cleanDoc = doc.replace(/\D/g, '');
    if (type === 'cpf' && cleanDoc.length <= 11) {
      return cleanDoc
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    } else if (type === 'cnpj' && cleanDoc.length <= 14) {
      return cleanDoc
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2');
    }
    return doc;
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatDocument(e.target.value, formData.documentType);
    setFormData(prev => ({ ...prev, document: value }));
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'cnpj') => {
    setFormData(prev => ({ ...prev, documentType: type, document: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowLoginPrompt(false);
    
    if (!formData.acceptTerms) {
      setError("Você precisa aceitar os termos de uso");
      return;
    }

    if (!validateDocument(formData.document, formData.documentType)) {
      setError(`${formData.documentType.toUpperCase()} inválido`);
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Verificar se o usuário já existe
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: 'temporary_check_only_not_real_password',
      });

      // Se o erro for "Invalid login credentials", mas o usuário existir, 
      // o Supabase Auth costuma retornar 400. Se retornar sucesso (improvável aqui), 
      // ou se o erro indicar que a conta existe, mostramos o prompt.
      if (signInError && (signInError.message.includes("Invalid login credentials") || signInError.status === 400)) {
        // Tentar um signUp para ver se o erro é de "user already registered"
        const { error: signUpCheckError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36),
        });

        if (signUpCheckError && (signUpCheckError.status === 422 || signUpCheckError.message.includes("already registered"))) {
          setShowLoginPrompt(true);
          setIsProcessing(false);
          return;
        }
      }

      // 2. Criar usuário com senha temporária forte
      const tempPassword = `Colora@${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            company: formData.company,
            document: formData.document,
            document_type: formData.documentType,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.session) {
        // Se precisar de confirmação de e-mail
        setError("Verifique seu e-mail para confirmar o cadastro e depois faça login para continuar o checkout.");
        navigate(`/login?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      // 3. Chamar a Edge Function do Stripe
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-checkout', {
        body: { 
          mode: 'subscription',
          customerData: {
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            document: formData.document,
            document_type: formData.documentType,
          }
        }
      });

      if (stripeError) {
        // Se der erro no Stripe, o usuário foi criado mas não pagou.
        // O ideal seria deletar o usuário, mas o cliente anon não tem permissão.
        // Vamos apenas informar o erro e pedir para tentar login.
        console.error("Erro no Stripe:", stripeError);
        throw new Error("Erro ao iniciar pagamento. Sua conta foi criada, tente fazer login para continuar.");
      }
      
      if (stripeData?.url) {
        window.location.href = stripeData.url;
      } else {
        throw new Error("Não foi possível criar a sessão de pagamento");
      }

    } catch (error: any) {
      console.error("Erro no processamento:", error);
      setError(error.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSvg} alt="Logotipo Colora" className="w-32" />
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar para home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">Assine o Colora</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Transforme sua loja com simulação de cores por IA.
              </p>
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-foreground">Plano Profissional</span>
                  <span className="text-2xl font-display font-bold text-foreground">R$ 59,90</span>
                </div>
                <div className="text-sm text-muted-foreground">por mês</div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" /> Dados Pessoais
                </h3>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Nome completo *"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="E-mail *"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Telefone *"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Dados da Empresa
                </h3>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Nome da loja/empresa"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                />
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" checked={formData.documentType === 'cpf'} onChange={() => handleDocumentTypeChange('cpf')} className="mr-2" />
                    <span className="text-sm">CPF</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" checked={formData.documentType === 'cnpj'} onChange={() => handleDocumentTypeChange('cnpj')} className="mr-2" />
                    <span className="text-sm">CNPJ</span>
                  </label>
                </div>
                <input
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  required
                  placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.acceptTerms} onChange={handleInputChange} name="acceptTerms" className="mt-1" />
                  <span className="text-sm text-muted-foreground">
                    Li e aceito os <Link to="/terms" className="text-primary hover:underline">termos de uso</Link> e a <Link to="/privacy" className="text-primary hover:underline">política de privacidade</Link>
                  </span>
                </label>
              </div>

              <Button type="submit" size="lg" variant="gradient-secondary" className="w-full" disabled={isProcessing}>
                {isProcessing ? "Processando..." : "Pagar com Stripe"}
              </Button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-border rounded-xl p-6">
              <h4 className="text-lg font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Garantia de 7 dias
              </h4>
              <p className="text-muted-foreground text-sm">
                Teste o Colora por 7 dias. Se não gostar, cancele sem custo algum.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-mail já cadastrado</DialogTitle>
            <DialogDescription>
              Este e-mail já está cadastrado em nossa plataforma. Por favor, faça login para continuar seu checkout.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>Cancelar</Button>
            <Button onClick={() => navigate(`/login?email=${encodeURIComponent(formData.email)}`)}>Fazer login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
