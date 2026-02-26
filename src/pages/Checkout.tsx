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
    password: "",
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

  // Validar CPF/CNPJ
  const validateDocument = (doc: string, type: string) => {
    const cleanDoc = doc.replace(/\D/g, '');
    
    if (type === 'cpf') {
      return cleanDoc.length === 11;
    } else if (type === 'cnpj') {
      return cleanDoc.length === 14;
    }
    return false;
  };

  // Format CPF/CNPJ
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
    setFormData(prev => ({
      ...prev,
      document: value
    }));
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'cnpj') => {
    setFormData(prev => ({
      ...prev,
      documentType: type,
      document: '' // Limpar campo ao mudar tipo
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowLoginPrompt(false);
    
    if (!formData.acceptTerms) {
      setError("Você precisa aceitar os termos de uso");
      return;
    }

    // Validar documento
    if (!validateDocument(formData.document, formData.documentType)) {
      setError(`${formData.documentType.toUpperCase()} inválido`);
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Criar usuário no Supabase Auth com metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            document: formData.document,
            document_type: formData.documentType,
            full_name: formData.name,
            document_number: formData.document,
          }
        }
      });

      let userId = authData.user?.id;

      if (!authError && !authData.session) {
        setError("Verifique seu e-mail para confirmar o cadastro e depois faça login para continuar o checkout.");
        navigate(`/login?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      // Se usuário já existe, fazer login
      if (authError) {
        const msg = (authError as any)?.message || "";
        const alreadyRegistered = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered") || (authError as any)?.status === 422;

        if (alreadyRegistered) {
          // Perguntar ao usuário se deseja fazer login
          const shouldGoToLogin = window.confirm(
            "Este e-mail já está cadastrado. Deseja fazer login para continuar o checkout?"
          );

          if (shouldGoToLogin) {
            navigate(`/login?email=${encodeURIComponent(formData.email)}`);
            return;
          } else {
            setError("Use outro e-mail ou faça login para continuar.");
            setIsProcessing(false);
            return;
          }
        }

        if (!alreadyRegistered) {
          throw authError;
        }
      }

      // 2. Salvar/atualizar perfil diretamente (fallback se migration não funcionou)
      if (userId) {
        const profileData = {
          id: userId,
          company_name: formData.company || formData.name,
          company_phone: formData.phone,
          company_address: formData.company,
          updated_at: new Date().toISOString(),
        };

        // Tentar salvar campos novos (se existirem na tabela)
        const extendedProfileData = {
          ...profileData,
          full_name: formData.name,
          document_type: formData.documentType,
          document_number: formData.document,
        };

        try {
          // Primeiro tenta com todos os campos
          let { error: profileError } = await supabase
            .from('profiles')
            .upsert(extendedProfileData, {
              onConflict: 'id',  // Especifica que o conflito é no campo id
              ignoreDuplicates: false  // Atualiza se existir
            });

          // Se der erro de coluna, tenta sem os campos novos
          if (profileError && profileError.message.includes('column')) {
            console.log('⚠️ Migration não aplicada, usando campos básicos');
            await supabase
              .from('profiles')
              .upsert(profileData, {
                onConflict: 'id',
                ignoreDuplicates: false
              });
          }

          console.log('✅ Perfil salvo com sucesso');
        } catch (error: any) {
          console.error('❌ Erro ao salvar perfil:', error);
          // Se der 409, significa que o perfil já existe - não é um erro crítico
          if (error.message?.includes('409') || error.message?.includes('duplicate')) {
            console.log('⚠️ Perfil já existe, continuando...');
          } else {
            throw error;
          }
        }
      }

      // 3. Criar sessão Stripe
      const { data, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
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

      if (checkoutError) throw checkoutError;
      
      if (data?.url) {
        // 4. Redirecionar para Stripe Checkout
        window.location.href = data.url;
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
      {/* Header */}
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
          {/* Left Column - Form */}
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Assine o Colora
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Transforme sua loja com simulação de cores por IA. Cadastre-se e comece a usar hoje mesmo.
              </p>
              
              {/* Price Summary */}
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-foreground">Plano Profissional</span>
                  <span className="text-2xl font-display font-bold text-foreground">R$ 59,90</span>
                </div>
                <div className="text-sm text-muted-foreground">por mês</div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Cancelamento a qualquer momento
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Senha *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dados da Empresa
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome da loja/empresa
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Sua Loja de Tintas Ltda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de documento *
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="documentType"
                        value="cpf"
                        checked={formData.documentType === 'cpf'}
                        onChange={() => handleDocumentTypeChange('cpf')}
                        className="mr-2"
                      />
                      <span className="text-sm">CPF (Pessoa Física)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="documentType"
                        value="cnpj"
                        checked={formData.documentType === 'cnpj'}
                        onChange={() => handleDocumentTypeChange('cnpj')}
                        className="mr-2"
                      />
                      <span className="text-sm">CNPJ (Pessoa Jurídica)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {formData.documentType === 'cpf' ? 'CPF' : 'CNPJ'} *
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleDocumentChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.documentType === 'cpf' 
                      ? 'Digite seu CPF sem pontos ou traços' 
                      : 'Digite seu CNPJ sem pontos, traços ou barra'
                    }
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Li e aceito os{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      termos de uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      política de privacidade
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                variant="gradient-secondary"
                className="w-full button-glow"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  "Processando..."
                ) : (
                  <>
                    Pagar com Stripe <CreditCard className="w-4 h-4 ml-2" />
                    <div className="button-shine" />
                  </>
                )}
              </Button>

              {/* Security Note */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                Pagamento 100% seguro via Stripe
              </div>
            </form>
          </div>

          {/* Right Column - Benefits */}
          <div className="space-y-8">
            {/* What's Included */}
            <div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-6">
                O que está incluído?
              </h3>
              <div className="space-y-4">
                {[
                  "200 simulações com IA por mês",
                  "Catálogos personalizados ilimitados", 
                  "White-label com sua marca",
                  "Link exclusivo para clientes",
                  "Importação/Exportação CSV",
                  "Geração de PDF profissional",
                  "Funciona no celular e desktop",
                  "Suporte prioritário 24/7",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-primary" />
                <h4 className="text-lg font-display font-semibold text-foreground">
                  Garantia de 7 dias
                </h4>
              </div>
              <p className="text-muted-foreground">
                Teste o Colora por 7 dias. Se não gostar, cancele sem custo algum. Sem complicações, sem multas.
              </p>
            </div>

            {/* Testimonial */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-foreground italic mb-3">
                "O Colora revolucionou nosso atendimento. Os clientes agora compram com muito mais confiança."
              </p>
              <p className="text-sm text-muted-foreground">
                — João Silva, Loja Cores & Texturas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
