import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Upload, Palette, Sparkles, Monitor, ArrowRight, Check,
  Shield, Users, Star, Store, FileDown, Video, X,
  Mail, Instagram, Linkedin, Play, ShieldCheck,
  Camera, Zap, TrendingUp, Clock, BadgeCheck, Gift,
  ChevronRight, Target, DollarSign, Paintbrush, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroWhite from "@/assets/HeroWhite.jpg";
import heroYellowstone from "@/assets/HeroYellowstone.jpg";
import heroTiffany from "@/assets/HeroTiffany.jpg";
import logoSvg from "@/assets/colora-logo.svg";
import { cn } from "@/lib/utils";

const stats = [
  { value: "3 seg", label: "Tempo de simulação", icon: Zap },
  { value: "200+", label: "Lojas ativas", icon: Store },
  { value: "White-label", label: "Sua marca, sua cara", icon: Monitor },
  { value: "+40%", label: "Aumento em vendas", icon: TrendingUp },
];

const steps = [
  {
    icon: Camera,
    title: "Tire a foto",
    description: "O vendedor fotografa o ambiente do cliente diretamente do celular ou computador da loja.",
  },
  {
    icon: Palette,
    title: "Escolha a cor",
    description: "Selecione cores do catálogo da sua loja. Qualquer marca, qualquer coleção.",
  },
  {
    icon: Sparkles,
    title: "Veja a mágica",
    description: "A IA gera uma visualização fotorrealista da parede pintada em 3 segundos.",
  },
  {
    icon: FileDown,
    title: "Feche a venda",
    description: "Envie o resultado por WhatsApp ou gere um PDF com a proposta na hora.",
  },
];

const painPoints = [
  {
    problem: "Cliente indeciso olhando leques por 30 minutos",
    solution: "Visualização instantânea na cor real, decisão em 3 minutos",
  },
  {
    problem: "\"Vou pensar e depois eu volto\" — e nunca mais volta",
    solution: "Com a simulação na mão, o cliente fecha na hora",
  },
  {
    problem: "Devoluções de tinta por \"não era essa cor que eu imaginei\"",
    solution: "Zero surpresas: o cliente VÊ o resultado antes de comprar",
  },
];

const testimonials = [
  {
    name: "Carlos M.",
    role: "Dono de loja em São Paulo",
    text: "Meus vendedores fecham 40% mais galões desde que começaram a usar o Colora no balcão.",
    stars: 5,
  },
  {
    name: "Fernanda R.",
    role: "Gerente de loja em Curitiba",
    text: "O cliente chega indeciso e sai com 3 cores na sacola. A simulação é a melhor ferramenta de venda que já tivemos.",
    stars: 5,
  },
  {
    name: "Roberto S.",
    role: "Franqueado em Belo Horizonte",
    text: "Instalei em 5 minutos. Meus vendedores usam pelo celular e os clientes adoram ver o resultado na hora.",
    stars: 5,
  },
];

const faqs = [
  {
    q: "Funciona com qualquer marca de tinta?",
    a: "Sim. Você importa catálogos de qualquer fabricante via CSV ou cadastra as cores manualmente. Suvinil, Coral, Sherwin-Williams, Lukscolor — qualquer uma."
  },
  {
    q: "Preciso de equipamento especial?",
    a: "Não. Funciona no celular, tablet ou computador que você já tem na loja. Basta ter internet."
  },
  {
    q: "Como funciona o teste gratuito?",
    a: "Você se cadastra em 30 segundos e ganha 3 simulações grátis para testar com clientes reais. Sem cartão de crédito."
  },
  {
    q: "O cliente precisa baixar algum app?",
    a: "Não. Tudo funciona no navegador. Você pode enviar o resultado por WhatsApp como um link ou imagem."
  },
  {
    q: "E o White-Label, como funciona?",
    a: "Você coloca sua logo, suas cores e ganha um link exclusivo. O cliente nunca vê a marca Colora — só a sua."
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem contrato, sem fidelidade. Cancela com um clique no painel quando quiser."
  }
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const roomImages = [
    { src: heroWhite, colorName: "Original", colorCode: "#F8F9FA", label: "Antes" },
    { src: heroYellowstone, colorName: "Sândalo Suave", colorCode: "#E5D1B8", label: "Tons Quentes" },
    { src: heroTiffany, colorName: "Brisa Serena", colorCode: "#A8DADC", label: "Tons Frios" },
  ];

  useEffect(() => {
    document.body.classList.add('landing-page');
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Auto-rotate hero images
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % roomImages.length);
    }, 4000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove('landing-page');
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/5 selection:text-primary overflow-x-hidden tracking-tight text-slate-700">
      
      {/* Sticky CTA Mobile */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[110] p-3 bg-white/95 backdrop-blur-md border-t border-slate-100 flex gap-2 md:hidden transition-transform duration-500",
        scrolled ? "translate-y-0" : "translate-y-full"
      )}>
        <Button variant="default" size="lg" asChild className="flex-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-[11px] uppercase tracking-widest font-semibold h-12 shadow-lg shadow-green-600/20">
          <Link to="/login">
            <Gift className="w-4 h-4 mr-2" />
            Testar Grátis
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="rounded-full text-[11px] uppercase tracking-widest font-medium h-12 border-slate-200">
          <Link to="/checkout">Assinar</Link>
        </Button>
      </div>

      {/* Top Banner - Teste Grátis */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white text-center py-2.5 px-4 relative z-[101]">
        <Link to="/login" className="flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Gift className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Teste grátis — 3 simulações com IA sem precisar de cartão
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Navbar */}
      <nav className={cn(
        "fixed top-[36px] left-0 right-0 z-[100] transition-all duration-700 px-4 sm:px-6",
        scrolled ? "py-3" : "py-6"
      )}>
        <div className={cn(
          "container mx-auto max-w-6xl flex items-center justify-between px-6 sm:px-8 h-14 rounded-full transition-all duration-700",
          scrolled ? "bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 backdrop-blur-md" : "bg-transparent"
        )}>
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src={logoSvg} alt="Colora" className="h-6 sm:h-7" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#como-funciona" className="text-[12px] font-medium text-slate-400 hover:text-slate-800 transition-colors tracking-widest uppercase">Como Funciona</a>
            <a href="#resultados" className="text-[12px] font-medium text-slate-400 hover:text-slate-800 transition-colors tracking-widest uppercase">Resultados</a>
            <a href="#planos" className="text-[12px] font-medium text-slate-400 hover:text-slate-800 transition-colors tracking-widest uppercase">Planos</a>
            <a href="#faq" className="text-[12px] font-medium text-slate-400 hover:text-slate-800 transition-colors tracking-widest uppercase">Dúvidas</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-[12px] font-medium text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
              Entrar
            </Link>
            <Button variant="default" size="sm" asChild className="h-9 px-6 rounded-full font-semibold text-[11px] uppercase tracking-widest bg-gradient-to-r from-green-600 to-emerald-600 border-none shadow-none hover:shadow-md hover:shadow-green-600/20 transition-all duration-500">
              <Link to="/login">
                <Gift className="w-3.5 h-3.5 mr-1.5" />
                Teste Grátis
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center animate-fade-in">
            <div className="space-y-8 text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100">
                  <Gift className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700">3 simulações grátis para testar</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-[3.2rem] font-bold leading-[1.15] text-slate-900 tracking-tight">
                  Seu vendedor fecha <br className="hidden sm:block" />
                  <span className="text-gradient-subtle">mais vendas de tinta</span><br className="hidden sm:block" />
                  com IA no balcão.
                </h1>
                
                <p className="text-base sm:text-lg text-slate-500 max-w-lg leading-relaxed">
                  O cliente tira a foto do cômodo, escolhe a cor e <strong className="text-slate-700">vê o resultado na hora</strong>. 
                  Sem leques, sem dúvidas, sem devoluções. Seu atendente vira um consultor de cores em 30 segundos.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="default" size="lg" asChild className="h-14 px-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold tracking-wider text-sm uppercase transition-all shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30">
                  <Link to="/login">
                    <Gift className="w-4.5 h-4.5 mr-2" />
                    Testar Grátis Agora
                  </Link>
                </Button>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center justify-center sm:justify-start gap-3 text-slate-400 hover:text-slate-600 transition-all text-[13px] uppercase tracking-widest font-medium h-14"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-slate-400 text-slate-400" />
                  </div>
                  Ver em Ação
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Setup em 30 segundos
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Cancele quando quiser
                </div>
              </div>
            </div>

            {/* Hero Image Mockup */}
            <div className="relative group">
              <div className="relative bg-white rounded-[2rem] p-2 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
                <div className="relative aspect-[4/5] sm:aspect-square rounded-[1.5rem] overflow-hidden">
                  {roomImages.map((image, index) => (
                    <img
                      key={index}
                      src={image.src}
                      alt={image.colorName}
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                        index === currentImage ? "opacity-100" : "opacity-0"
                      )}
                    />
                  ))}
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 p-2.5 bg-white/85 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
                    {roomImages.map((image, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all duration-500",
                          i === currentImage ? "border-slate-800 scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: image.colorCode }}
                      />
                    ))}
                  </div>

                  {/* Label showing current color */}
                  <div className="absolute top-5 right-5 z-20">
                    <div className="bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/40 shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {roomImages[currentImage].colorName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-5 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce-slow">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">+40% vendas</p>
                  <p className="text-[9px] text-slate-400">em lojas parceiras</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 border-y border-slate-100 bg-slate-50/50">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 mb-1">
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{s.value}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dor vs Solução */}
      <section id="resultados" className="py-20 sm:py-24">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Antes vs Depois do Colora</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Acabe com a indecisão <br className="hidden sm:block" />que trava suas vendas
            </h2>
          </div>

          <div className="grid gap-5">
            {painPoints.map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-0 rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-all">
                <div className="flex items-start gap-4 p-6 sm:p-8 bg-red-50/40">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </div>
                  <p className="text-sm text-red-800/70 leading-relaxed">{item.problem}</p>
                </div>
                <div className="flex items-start gap-4 p-6 sm:p-8 bg-green-50/40">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <p className="text-sm text-green-800/80 font-medium leading-relaxed">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 sm:py-24 bg-slate-50/50">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Simples assim</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              4 passos para fechar a venda
            </h2>
            <p className="text-slate-400 text-base max-w-lg mx-auto">
              Qualquer vendedor aprende em 2 minutos. Sem treinamento, sem complicação.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-7 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-500 group">
                <div className="absolute top-5 right-5 text-[40px] font-black text-slate-100 leading-none select-none group-hover:text-slate-200 transition-colors">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center text-white mb-5 shadow-lg">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="default" size="lg" asChild className="h-13 px-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold tracking-wider text-sm uppercase shadow-lg shadow-green-600/20">
              <Link to="/login">
                <Gift className="w-4 h-4 mr-2" />
                Experimentar Grátis
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Funcionalidades Chave */}
      <section id="funcionalidades" className="py-20 sm:py-24">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Tudo que você precisa</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Feito para o dia a dia <br className="hidden sm:block" /> da loja de tintas
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Palette, title: "Catálogo da SUA Loja", desc: "Importe cores de qualquer fabricante. Suvinil, Coral, Sherwin-Williams — todas." },
              { icon: Monitor, title: "100% White-Label", desc: "Sua logo, suas cores, seu domínio. O cliente vê apenas a sua marca." },
              { icon: Sparkles, title: "IA Fotorrealista", desc: "Renderização profissional em 3 segundos. O cliente vê exatamente como vai ficar." },
              { icon: Upload, title: "Foto do Celular", desc: "Funciona com qualquer foto. Sem equipamento especial, sem complicação." },
              { icon: FileDown, title: "Proposta em PDF", desc: "Gere um orçamento visual com sua logo para o cliente levar para casa." },
              { icon: Shield, title: "Dados Seguros", desc: "Criptografia de ponta e hospedagem em nuvem. Seus dados estão protegidos." },
            ].map((feat, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-500">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 mb-4">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 sm:py-24 bg-slate-900 text-white">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Quem usa, recomenda</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Lojistas que já vendem <br className="hidden sm:block" />mais com Colora
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="planos" className="py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center space-y-14">
            <div className="space-y-4 max-w-xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Investimento</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Menos que uma lata de tinta. <br />Mais vendas o mês inteiro.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
              {/* Card Teste Grátis */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2rem] p-8 sm:p-10 border-2 border-green-200 space-y-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Comece Aqui
                  </span>
                </div>
                <div className="text-center space-y-2 pt-2">
                  <h3 className="text-lg font-bold text-slate-800">Teste Gratuito</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-green-700">R$ 0</span>
                  </div>
                  <p className="text-xs text-slate-500">Sem cartão de crédito</p>
                </div>

                <ul className="space-y-3">
                  {[
                    "3 Simulações IA incluídas",
                    "Catálogo de cores padrão",
                    "Resultado fotorrealista",
                    "Setup em 30 segundos",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button variant="default" size="lg" asChild className="w-full h-12 rounded-full bg-green-600 hover:bg-green-700 text-[12px] uppercase tracking-[0.15em] font-semibold transition-all shadow-lg shadow-green-600/20">
                  <Link to="/login">
                    <Gift className="w-4 h-4 mr-2" />
                    Criar Conta Grátis
                  </Link>
                </Button>
              </div>

              {/* Card Plano Pro */}
              <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-200 space-y-6 relative shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rainbow-border text-slate-700 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-white">
                    Mais Popular
                  </span>
                </div>
                <div className="text-center space-y-2 pt-2">
                  <h3 className="text-lg font-bold text-slate-800">Colora Pro</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-slate-900">R$ 59</span>
                    <div className="text-left ml-1">
                      <p className="text-lg font-bold text-slate-900">,90</p>
                      <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">/mês</p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3">
                  {[
                    "200 Simulações IA / mês",
                    "Catálogos ilimitados (sua marca)",
                    "100% White-Label",
                    "Propostas em PDF com sua logo",
                    "Suporte prioritário",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button variant="default" size="lg" asChild className="w-full h-12 rounded-full bg-slate-800 hover:bg-slate-900 text-[12px] uppercase tracking-[0.15em] font-semibold transition-all shadow-none">
                  <Link to="/checkout">Assinar Agora</Link>
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Cancele quando quiser
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24 bg-slate-50/50">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Tire suas dúvidas</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:border-slate-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4"
                >
                  <span className="text-sm font-semibold text-slate-700">{faq.q}</span>
                  <div className={cn("transition-transform duration-300 flex-shrink-0", openFaq === i ? "rotate-45" : "")}>
                    <PlusIcon className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
                <div className={cn(
                  "px-6 transition-all duration-500 ease-in-out overflow-hidden",
                  openFaq === i ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-3xl px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 mx-auto">
            <Gift className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700">Oferta de lançamento</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Comece hoje mesmo.<br />3 simulações por nossa conta.
          </h2>
          <p className="text-base text-slate-400 max-w-lg mx-auto">
            Crie sua conta em 30 segundos, teste com um cliente real e veja a diferença no balcão.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" asChild className="h-14 px-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold tracking-wider text-sm uppercase shadow-lg shadow-green-600/20">
              <Link to="/login">
                <Gift className="w-4 h-4 mr-2" />
                Criar Minha Conta Grátis
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Check className="w-3.5 h-3.5 text-green-500" />
              Sem cartão
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Check className="w-3.5 h-3.5 text-green-500" />
              Sem contrato
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Check className="w-3.5 h-3.5 text-green-500" />
              Cancele quando quiser
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 text-white/90">
        <div className="container mx-auto max-w-6xl px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5 space-y-6 text-left">
              <img src={logoSvg} alt="Colora" className="h-7 brightness-0 invert opacity-90" />
              <p className="text-slate-500 text-base leading-relaxed max-w-sm">
                A ferramenta de IA que transforma o balcão da loja de tintas em uma experiência de consultoria visual.
              </p>
              <div className="flex gap-4">
                {[Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-5 text-left">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Plataforma</h4>
              <ul className="space-y-3">
                {[
                  { label: "Como Funciona", href: "#como-funciona" },
                  { label: "Resultados", href: "#resultados" },
                  { label: "Planos", href: "#planos" },
                  { label: "Dúvidas", href: "#faq" },
                ].map(item => (
                  <li key={item.label}>
                    <a href={item.href} className="text-slate-400 text-[13px] hover:text-white transition-colors">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 space-y-5 text-left">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Contato</h4>
              <ul className="space-y-3 text-[13px] text-slate-400">
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 opacity-40" />
                  contato@colora.app.br
                </li>
              </ul>
              <div className="pt-4">
                <div className="flex gap-3">
                  <Link to="/termos" className="text-[11px] text-slate-500 hover:text-white transition-colors">Termos</Link>
                  <span className="text-slate-700">·</span>
                  <Link to="/privacidade" className="text-[11px] text-slate-500 hover:text-white transition-colors">Privacidade</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
              © {new Date().getFullYear()} Colora IA. Todos os direitos reservados.
            </p>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 py-2 px-4 rounded-xl border border-white/5 bg-white/5">
                <Shield className="w-4 h-4 text-emerald-500/70" />
                <div className="text-left">
                  <p className="text-[9px] font-bold text-white uppercase tracking-widest leading-none mb-1">Pagamento Seguro</p>
                  <p className="text-[8px] font-medium text-slate-500 uppercase leading-none">Criptografia SSL</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-[2rem] max-w-4xl w-full overflow-hidden animate-in zoom-in duration-500 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest">Veja o Colora em ação</h3>
              </div>
              <button onClick={() => setShowVideoModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-white" />
               <div className="relative z-10 text-center space-y-6 p-8">
                  <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto cursor-pointer hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 text-slate-300 fill-slate-300 ml-1" />
                  </div>
                  <p className="text-slate-400 text-lg">Demonstração em breve</p>
               </div>
            </div>

            <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border-t border-slate-50">
               <div className="space-y-1 text-center sm:text-left">
                  <p className="text-lg font-bold text-slate-800">Quer testar agora?</p>
                  <p className="text-slate-400 text-sm">3 simulações grátis, sem cartão de crédito.</p>
               </div>
               <Button variant="default" size="lg" asChild className="rounded-full px-10 h-12 bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-600/20">
                  <Link to="/login" className="text-[12px] uppercase tracking-widest font-semibold">
                    <Gift className="w-4 h-4 mr-2" />
                    Testar Grátis
                  </Link>
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default Landing;
