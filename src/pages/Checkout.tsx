import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Shield, CreditCard, User, Mail, Phone, Building2, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      // Chamar a Edge Function do Stripe diretamente (fluxo de convidado)
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-checkout', {
        body: { 
          mode: 'subscription',
          customerData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            document: formData.document,
            documentType: formData.documentType,
          }
        }
      });

      if (stripeError) {
        console.error("Erro no Stripe:", stripeError);
        throw new Error("Erro ao iniciar pagamento. Verifique seus dados e tente novamente.");
      }
      
      if (stripeData?.url) {
        // Redirecionar para o Stripe Checkout
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
                Sua conta será criada automaticamente após a confirmação do pagamento.
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
                  placeholder="Seu melhor e-mail *"
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
                {isProcessing ? "Processando..." : "Ir para o Pagamento Seguro"}
              </Button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <h4 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" /> O que acontece agora?
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>1. Você será redirecionado para o Stripe (Pagamento Seguro).</li>
                <li>2. Após o pagamento, nossa IA cria sua conta automaticamente.</li>
                <li>3. Você receberá um e-mail com seus dados de acesso.</li>
                <li>4. O acesso ao simulador é liberado instantaneamente.</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" /> Pagamento 100% criptografado via Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
