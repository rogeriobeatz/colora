import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Building2, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/layouts/PublicLayout";

const Checkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "", document: "", documentType: "cpf", acceptTerms: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateDocument = (doc: string, type: string) => {
    const clean = doc.replace(/\D/g, '');
    return type === 'cpf' ? clean.length === 11 : clean.length === 14;
  };

  const formatDocument = (doc: string, type: string) => {
    const c = doc.replace(/\D/g, '');
    if (type === 'cpf' && c.length <= 11) return c.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2');
    if (type === 'cnpj' && c.length <= 14) return c.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})/, '$1-$2');
    return doc;
  };

  const formatPhone = (phone: string) => {
    const c = phone.replace(/\D/g, '');
    if (c.length <= 2) return c;
    if (c.length <= 7) return `(${c.slice(0, 2)}) ${c.slice(2)}`;
    if (c.length <= 10) return `(${c.slice(0, 2)}) ${c.slice(2, 6)}-${c.slice(6)}`;
    return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.acceptTerms) { setError("Você precisa aceitar os termos de uso"); return; }
    if (!validateDocument(formData.document, formData.documentType)) { setError(`${formData.documentType.toUpperCase()} inválido`); return; }
    setIsProcessing(true);
    try {
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-checkout', {
        body: { mode: 'subscription', customerData: { name: formData.name, email: formData.email, phone: formData.phone, company: formData.company, document: formData.document, documentType: formData.documentType } }
      });
      if (stripeError) throw new Error("Erro ao iniciar pagamento.");
      if (stripeData?.url) window.location.href = stripeData.url;
      else throw new Error("Não foi possível criar a sessão de pagamento");
    } catch (error: any) {
      setError(error.message || "Ocorreu um erro. Tente novamente.");
    } finally { setIsProcessing(false); }
  };

  return (
    <PublicLayout>
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">Assine o Colora</h1>
            <p className="text-sm text-muted-foreground mb-6">Sua conta será criada automaticamente após a confirmação do pagamento.</p>
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-foreground font-medium">Plano Profissional</span>
                <span className="text-2xl font-display font-bold text-foreground">R$ 59,90</span>
              </div>
              <div className="text-sm text-muted-foreground">por mês</div>
            </div>
          </div>

          {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2"><User className="w-5 h-5" /> Dados Pessoais</h3>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Nome completo *" className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm" />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Seu melhor e-mail *" className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm" />
              <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))} required placeholder="(11) 99999-9999 *" maxLength={15} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm" />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2"><Building2 className="w-5 h-5" /> Dados da Empresa</h3>
              <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="Nome da loja/empresa" className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm" />
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer"><input type="radio" checked={formData.documentType === 'cpf'} onChange={() => setFormData(prev => ({ ...prev, documentType: 'cpf', document: '' }))} className="mr-2" /><span className="text-sm">CPF</span></label>
                <label className="flex items-center cursor-pointer"><input type="radio" checked={formData.documentType === 'cnpj'} onChange={() => setFormData(prev => ({ ...prev, documentType: 'cnpj', document: '' }))} className="mr-2" /><span className="text-sm">CNPJ</span></label>
              </div>
              <input type="text" name="document" value={formData.document} onChange={(e) => setFormData(prev => ({ ...prev, document: formatDocument(e.target.value, formData.documentType) }))} required placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.acceptTerms} onChange={handleInputChange} name="acceptTerms" className="mt-1" />
              <span className="text-sm text-muted-foreground">
                Li e aceito os <Link to="/terms" className="text-primary hover:underline">termos de uso</Link> e a <Link to="/privacy" className="text-primary hover:underline">política de privacidade</Link>
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Processando..." : "Ir para o Pagamento Seguro"}
            </Button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> O que acontece agora?</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>1. Você será redirecionado para o Stripe (Pagamento Seguro).</li>
              <li>2. Após o pagamento, sua conta é criada automaticamente.</li>
              <li>3. Você será redirecionado direto para o painel, já autenticado.</li>
              <li>4. Basta criar sua senha e começar a usar!</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="w-4 h-4" /> Pagamento 100% criptografado via Stripe</div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Checkout;
