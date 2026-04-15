import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Monitor, Check,
  FileDown, X,
  Play, Lock,
  HelpCircle, ShieldCheck, Zap, Palette, Layers, ChevronRight,
  MousePointer2, Search, ArrowRight, Shield, Globe, Award,
  Gift, Camera, Star, Upload, TrendingUp, Mail, Instagram, Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSvg from "@/assets/colora-logo.svg";
import heroWhite from "@/assets/HeroWhite.jpg";
import { cn } from "@/lib/utils";
import { InteractiveHero } from "@/components/landing/InteractiveHero";

const AIScannerMockup = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const boxes = [
    { label: "Parede Principal", top: "25%", left: "15%", width: "40%", height: "50%", color: "border-blue-400" },
    { label: "Teto", top: "5%", left: "10%", width: "80%", height: "15%", color: "border-purple-400" },
    { label: "Rodapé", top: "85%", left: "5%", width: "90%", height: "8%", color: "border-emerald-400" },
    { label: "Móveis", top: "45%", left: "60%", width: "30%", height: "35%", color: "border-orange-400" },
  ];

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl bg-slate-900 overflow-hidden shadow-2xl group border border-white/10">
      <img src={heroWhite} alt="Scanner" className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-1000" />
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.8)] z-30 animate-scan" />
      {boxes.map((box, i) => (
        <div key={i} className={cn("absolute border-2 rounded-lg transition-all duration-700 z-20 flex flex-col items-start justify-start p-2 backdrop-blur-[1px] bg-white/5", box.color, activeStep === i ? "opacity-100 scale-100" : "opacity-0 scale-95")} style={{ top: box.top, left: box.left, width: box.width, height: box.height }}>
          <div className={cn("px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-1", box.color.replace('border', 'bg'))}>
            <Search className="w-2 h-2" />
            {box.label}
          </div>
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
      <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3">
        <div className="flex justify-between items-end mb-1">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">AI Analysis</p>
              <p className="text-[11px] font-bold text-white uppercase tracking-widest">{activeStep === 3 ? "Processamento Completo" : "Mapeando Superfícies..."}</p>
           </div>
           <span className="text-[10px] font-black text-primary font-mono">{(activeStep + 1) * 25}%</span>
        </div>
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${(activeStep + 1) * 25}%` }} />
        </div>
      </div>
    </div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LandingV2 = () => {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.classList.add('landing-page');
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove('landing-page');
    };
  }, []);

  const experienceCards = [
    { id: "01", title: "O Fim da Indecisão", desc: "Elimine a dúvida no balcão. Mostre ao cliente exatamente como a cor ficará na sua própria parede.", icon: MousePointer2, className: "lg:translate-y-0" },
    { id: "02", title: "Realismo de Estúdio", desc: "Luzes, sombras e texturas preservadas. Não é um filtro, é uma simulação de alta fidelidade técnica.", icon: Sparkles, className: "lg:translate-y-12" },
    { id: "03", title: "Harmonia & Emoção", desc: "Venda atmosferas, não apenas latas. Transforme a experiência de compra em um momento de inspiração.", icon: Palette, className: "lg:translate-y-24" }
  ];

  const brandLogos = ["Suvinil", "Coral", "Sherwin-Williams", "Eucatex", "Renner"];

  const faqs = [
    { q: "Como funciona o teste gratuito?", a: "Você se cadastra em 30 segundos e ganha 3 simulações grátis para testar com clientes reais. Sem cartão de crédito, sem compromisso." },
    { q: "A simulação funciona no celular?", a: "Sim, o Colora é totalmente responsivo. Funciona em qualquer navegador de smartphone (iPhone ou Android) sem precisar baixar nada." },
    { q: "Posso usar as cores da minha marca de tinta?", a: "Com certeza. Você pode subir o catálogo CSV da marca que revende ou cadastrar cores manuais com códigos Hexadecimal/RGB." },
    { q: "O white-label está incluso?", a: "Sim. Acreditamos que a sua marca deve estar em primeiro lugar. Em todos os planos você personaliza logo, cores e tipografia." },
    { q: "Funciona com qualquer marca de tinta?", a: "Sim. Suvinil, Coral, Sherwin-Williams, Lukscolor, Eucatex — qualquer fabricante. Importe via CSV ou cadastre manualmente." },
    { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem contrato, sem fidelidade. Cancela com um clique no painel quando quiser." }
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/5 selection:text-primary overflow-x-hidden tracking-tight text-slate-900 pb-20 md:pb-0">
      
      <div className="fixed top-0 left-0 right-0 h-1.5 z-[120] gradient-primary opacity-90" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mesh {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10%, 10%) scale(1.1); }
          66% { transform: translate(-10%, 5%) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-mesh {
          animation: mesh 20s infinite ease-in-out;
        }
        .animate-scan {
          animation: scan 4s infinite linear;
        }
        .text-editorial {
          letter-spacing: -0.05em;
          line-height: 0.85;
        }
        .glass-premium {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .rainbow-border {
          position: relative;
          background: #0f172a;
          color: white;
          border: none;
        }
        .rainbow-border::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: var(--gradient-primary);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}} />

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-slate-50 blur-[120px] animate-mesh" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-mesh" style={{ animationDelay: '-5s' }} />
      </div>

      {/* 🔥 Top Banner - Teste Grátis */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white text-center py-2.5 px-4 relative z-[115]">
        <Link to="/login" className="flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Gift className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Teste grátis — 3 simulações com IA sem precisar de cartão
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Sticky CTA Mobile */}
      <div className={cn("fixed bottom-0 left-0 right-0 z-[110] p-3 bg-white/95 backdrop-blur-md border-t border-slate-100 flex gap-2 md:hidden transition-all duration-700", scrolled ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>
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

      <nav className={cn("fixed top-[36px] left-0 right-0 z-[100] transition-all duration-1000 px-6", scrolled ? "py-3" : "py-6")}>
        <div className={cn("container mx-auto max-w-6xl flex items-center justify-between px-8 h-14 rounded-full transition-all duration-1000", scrolled ? "bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5" : "bg-transparent")}>
          <Link to="/" className="hover:opacity-60 transition-opacity">
            <img src={logoSvg} alt="Colora" className="h-6 sm:h-7" />
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <a href="#como-funciona" className="text-[11px] font-medium text-slate-400 hover:text-slate-900 transition-colors tracking-[0.15em] uppercase">Como Funciona</a>
            <a href="#resultados" className="text-[11px] font-medium text-slate-400 hover:text-slate-900 transition-colors tracking-[0.15em] uppercase">Resultados</a>
            <a href="#planos" className="text-[11px] font-medium text-slate-400 hover:text-slate-900 transition-colors tracking-[0.15em] uppercase">Planos</a>
            <a href="#duvidas" className="text-[11px] font-medium text-slate-400 hover:text-slate-900 transition-colors tracking-[0.15em] uppercase">Dúvidas</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-[11px] font-medium text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.15em]">
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

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 lg:gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 animate-in fade-in slide-in-from-left-4 duration-1000">
                  <Gift className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700">3 simulações grátis para testar</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[7rem] font-black text-editorial text-slate-950 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  Venda <br />
                  <span className="text-primary italic font-light opacity-90">Visionária.</span>
                </h1>
              </div>
              <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium">
                  O cliente tira a foto do cômodo, escolhe a cor e <strong className="text-slate-800">vê o resultado na hora</strong>. 
                  Sem leques, sem dúvidas, sem devoluções. Seu atendente vira um <span className="text-slate-800 font-bold italic underline decoration-primary/30 underline-offset-4">consultor de cores</span> em 30 segundos.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="default" size="lg" asChild className="h-14 px-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold tracking-wider text-sm uppercase transition-all shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30">
                    <Link to="/login">
                      <Gift className="w-4 h-4 mr-2" />
                      Testar Grátis Agora
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="h-14 px-8 rounded-full border-slate-200 text-slate-600 text-sm uppercase tracking-wider font-medium hover:bg-slate-50">
                    <Link to="/checkout">
                      Ver Planos
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-6 pt-1">
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
            </div>
            <div className="hidden lg:block relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-600">
               <div className="p-8 bg-white rounded-[3rem] shadow-2xl border border-slate-50 rotate-3 hover:rotate-0 transition-transform duration-700">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 font-mono">AI Scan Lab</p>
                  <AIScannerMockup />
               </div>
            </div>
          </div>
          <div className="mt-24 lg:mt-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
            <InteractiveHero primaryColor="#0f172a" secondaryColor="#1e293b" />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-12 border-y border-slate-50 bg-white/50">
        <div className="container mx-auto max-w-6xl px-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8">Compatível com os Maiores Fabricantes</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-30 hover:grayscale-0 transition-all duration-1000">
            {brandLogos.map((brand) => (
              <span key={brand} className="text-lg md:text-xl font-bold text-slate-400 font-serif italic">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 sm:py-28 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary opacity-50" />
        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
            {[
              { v: "3 seg", l: "Tempo de simulação", icon: Zap },
              { v: "200+", l: "Lojas ativas", icon: TrendingUp },
              { v: "Full", l: "White-Label", icon: Monitor },
              { v: "+40%", l: "Aumento em vendas", icon: Star }
            ].map((s, i) => (
              <div key={i} className="space-y-4 group text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mx-auto group-hover:bg-primary/10 transition-colors">
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{s.v}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.15em]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOR vs SOLUÇÃO */}
      <section id="resultados" className="py-20 sm:py-28">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Antes vs Depois do Colora</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Acabe com a indecisão <br className="hidden sm:block" />que trava suas vendas
            </h2>
          </div>

          <div className="grid gap-4">
            {[
              { problem: "Cliente indeciso olhando leques por 30 minutos", solution: "Visualização instantânea na cor real, decisão em 3 minutos" },
              { problem: "\"Vou pensar e depois eu volto\" — e nunca mais volta", solution: "Com a simulação na mão, o cliente fecha na hora" },
              { problem: "Devoluções de tinta por \"não era essa cor que eu imaginei\"", solution: "Zero surpresas: o cliente VÊ o resultado antes de comprar" },
            ].map((item, i) => (
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

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 sm:py-28 bg-slate-50/50">
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
            {[
              { icon: Camera, title: "Tire a foto", description: "O vendedor fotografa o ambiente do cliente diretamente do celular ou computador da loja." },
              { icon: Palette, title: "Escolha a cor", description: "Selecione cores do catálogo da sua loja. Qualquer marca, qualquer coleção." },
              { icon: Sparkles, title: "Veja a mágica", description: "A IA gera uma visualização fotorrealista da parede pintada em 3 segundos." },
              { icon: FileDown, title: "Feche a venda", description: "Envie o resultado por WhatsApp ou gere um PDF com a proposta na hora." },
            ].map((step, i) => (
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

      {/* THE EXPERIENCE */}
      <section id="experiencia" className="py-20 sm:py-28 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-20">
            <div className="max-w-2xl space-y-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary">Confiança para Decidir</h2>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-950 leading-[0.95]">Digitalize <br /> seu balcão.</h3>
            </div>
            <p className="text-slate-400 font-medium max-w-xs pb-2 leading-relaxed border-l-2 border-slate-50 pl-6">
              A jornada de venda mais envolvente do mercado brasileiro de tintas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
            {experienceCards.map((card, i) => (
              <div key={i} className={cn("group p-10 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all duration-700 hover:shadow-2xl hover:border-transparent hover:-translate-y-2", card.className)}>
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-slate-200 group-hover:text-primary transition-colors font-mono">{card.id}</span>
                    <card.icon className="w-8 h-8 text-slate-300 group-hover:text-primary transition-all group-hover:scale-110" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-slate-950">{card.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 sm:py-28 bg-slate-900 text-white">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Quem usa, recomenda</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Lojistas que já vendem <br className="hidden sm:block" />mais com Colora
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Carlos M.", role: "Dono de loja em São Paulo", text: "Meus vendedores fecham 40% mais galões desde que começaram a usar o Colora no balcão.", stars: 5 },
              { name: "Fernanda R.", role: "Gerente de loja em Curitiba", text: "O cliente chega indeciso e sai com 3 cores na sacola. A simulação é a melhor ferramenta de venda que já tivemos.", stars: 5 },
              { name: "Roberto S.", role: "Franqueado em Belo Horizonte", text: "Instalei em 5 minutos. Meus vendedores usam pelo celular e os clientes adoram ver o resultado na hora.", stars: 5 },
            ].map((t, i) => (
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

      {/* PLANOS / PRICING */}
      <section id="planos" className="py-20 sm:py-28">
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
                  <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
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

      {/* FAQ SECTION */}
      <section id="duvidas" className="py-20 sm:py-28 bg-slate-50/50 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-4 mb-14">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">Tire suas dúvidas</span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Perguntas Frequentes</h3>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:border-slate-200">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-5 text-left flex justify-between items-center gap-4">
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

      {/* CTA FINAL */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto max-w-3xl px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 mx-auto">
            <Gift className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700">Oferta de lançamento</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Comece hoje mesmo.<br />3 simulações por nossa conta.
          </h2>
          <p className="text-base text-slate-400 max-w-lg mx-auto">
            Crie sua conta em 30 segundos, teste com um cliente real e veja a diferença no balcão da sua loja.
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

      {/* FOOTER */}
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
                  { label: "Dúvidas", href: "#duvidas" },
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
                  <Link to="/terms" className="text-[11px] text-slate-500 hover:text-white transition-colors">Termos</Link>
                  <span className="text-slate-700">·</span>
                  <Link to="/privacy" className="text-[11px] text-slate-500 hover:text-white transition-colors">Privacidade</Link>
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
    </div>
  );
};

export default LandingV2;
