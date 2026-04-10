import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Monitor, Check,
  FileDown, X,
  Play, Lock,
  HelpCircle, ShieldCheck, Zap, Palette, Layers, ChevronRight,
  MousePointer2, Search, ArrowRight, Shield, Globe, Award
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

const LandingV2 = () => {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Smooth scrolling global
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

      {/* Sticky CTA Mobile */}
      <div className={cn("fixed bottom-0 left-0 right-0 z-[110] p-4 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex gap-3 md:hidden transition-all duration-700", scrolled ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>
        <Button variant="default" size="lg" asChild className="flex-1 rounded-2xl bg-slate-950 text-[10px] uppercase tracking-[0.2em] font-black h-14 shadow-2xl">
          <Link to="/checkout">Começar Agora</Link>
        </Button>
      </div>

      <nav className={cn("fixed top-0 left-0 right-0 z-[100] transition-all duration-1000 px-6", scrolled ? "py-4" : "py-10")}>
        <div className={cn("container mx-auto max-w-6xl flex items-center justify-between px-8 h-16 rounded-3xl transition-all duration-1000", scrolled ? "bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5" : "bg-transparent")}>
          <Link to="/" className="hover:opacity-60 transition-opacity">
            <img src={logoSvg} alt="Colora" className="h-6 sm:h-8" />
          </Link>
          <div className="hidden md:flex items-center gap-12">
            {["Experiência", "Estratégia", "Dúvidas"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")}`} className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors tracking-[0.2em] uppercase font-mono">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] font-mono">Login</Link>
            <Button variant="default" size="sm" asChild className="rainbow-border h-10 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl shadow-slate-200">
              <Link to="/checkout">Começar</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 lg:pt-60 lg:pb-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-20 items-end">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 animate-in fade-in slide-in-from-left-4 duration-1000">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">A Nova Era do Varejo de Tintas</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-[8rem] lg:text-[9.5rem] font-black text-editorial text-slate-950 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  Venda <br />
                  <span className="text-primary italic font-light opacity-90 text-6xl sm:text-7xl md:text-[8rem]">Visionária.</span>
                </h1>
              </div>
              <div className="max-w-xl space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-medium">
                  A beleza de <span className="text-slate-950 font-bold italic underline decoration-primary/30 underline-offset-8">simular atmosferas</span> para eliminar a indecisão no balcão. Digitalize sua marca com realismo fotográfico.
                </p>
                <div className="flex flex-wrap items-center gap-8">
                  <Button variant="default" size="lg" asChild className="rainbow-border h-16 px-12 rounded-2xl font-black tracking-[0.2em] text-[11px] uppercase transition-all shadow-2xl hover:scale-105 active:scale-95">
                    <Link to="/checkout">Ativar Minha Loja</Link>
                  </Button>
                  <div className="flex flex-col border-l-2 border-slate-100 pl-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">White-Label Premium</span>
                    <span className="text-sm font-bold text-slate-900">Ativação Imediata</span>
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
          <div className="mt-32 lg:mt-40 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
            <InteractiveHero primaryColor="#0f172a" secondaryColor="#1e293b" />
          </div>
        </div>
      </section>

      {/* TRUST BAR (NOVO) */}
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

      {/* STATS SECTION (HIGH CONTRAST) */}
      <section className="py-40 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary opacity-50" />
        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-20">
            {[
              { v: "01", l: "Líder em Realismo" },
              { v: "200+", l: "Lojas Ativas" },
              { v: "Full", l: "White-Label" },
              { v: "24/7", l: "Suporte VIP" }
            ].map((s, i) => (
              <div key={i} className="space-y-4 group">
                <p className="text-6xl md:text-8xl font-black text-white/5 group-hover:text-primary transition-colors duration-700 font-mono">{s.v}</p>
                <div className="space-y-1 pl-2 border-l-2 border-primary/30 group-hover:border-primary transition-colors duration-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{s.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE EXPERIENCE */}
      <section id="experiencia" className="py-40 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-32">
            <div className="max-w-2xl space-y-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary">Confiança para Decidir</h2>
              <h3 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-950 leading-[0.95]">Digitalize <br /> seu balcão.</h3>
            </div>
            <p className="text-slate-400 font-medium max-w-xs pb-2 leading-relaxed border-l-2 border-slate-50 pl-6">
              A jornada de venda mais envolvente do mercado brasileiro de tintas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
            {experienceCards.map((card, i) => (
              <div key={i} className={cn("group p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm transition-all duration-700 hover:shadow-2xl hover:border-transparent hover:-translate-y-2", card.className)}>
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

      {/* MASTER CARD (COLORA DARK STYLE) */}
      <section id="estrategia" className="py-40 px-6 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-6 text-left">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary font-mono">Inovação Escalável</h2>
                <h3 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-slate-950">Um investimento <br /> que se paga.</h3>
              </div>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Plataforma 100% white-label para você vender atmosferas, não apenas latas de tinta.
              </p>
              <div className="flex flex-col gap-6">
                {[
                  { icon: Shield, text: "Custo menor que uma lata de tinta" },
                  { icon: X, text: "Cancele com apenas um clique" },
                  { icon: Globe, text: "Sua Logo e Suas Cores em todo lugar" },
                  { icon: Award, text: "Suporte VIP via WhatsApp" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-slate-400 group">
                    <item.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
               <div className="p-1 gradient-primary rounded-[4rem] shadow-2xl transition-transform duration-1000 group-hover:scale-[1.01]">
                  <div className="bg-slate-950 rounded-[3.8rem] p-16 text-white space-y-12">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-mono">Plano Mensal</p>
                        <h4 className="text-2xl font-bold">Assinatura Profissional</h4>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                         <Zap className="w-8 h-8 fill-primary" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[14px] font-black text-white/30 uppercase tracking-widest font-mono">R$</span>
                      <span className="text-9xl font-black tracking-tighter leading-none">59</span>
                      <div className="text-left mb-2">
                        <p className="text-3xl font-bold text-white">,90</p>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">por mês</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-8 py-8 border-y border-white/10">
                       <ul className="space-y-4">
                          {["200 Simulações IA", "Sua Logo e Cores", "Orçamentos em PDF"].map(item => <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-300"><Check className="w-4 h-4 text-primary" /> {item}</li>)}
                       </ul>
                       <ul className="space-y-4">
                          {["Catálogos Ilimitados", "Suporte 24/7", "Plataforma Web"].map(item => <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-300"><Check className="w-4 h-4 text-primary" /> {item}</li>)}
                       </ul>
                    </div>
                    <Button variant="default" size="lg" asChild className="w-full h-20 rounded-3xl bg-white text-black hover:bg-slate-100 text-[11px] uppercase tracking-[0.3em] font-black transition-all shadow-2xl hover:scale-105 active:scale-95 border-none">
                      <Link to="/checkout">Ativar Agora</Link>
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="duvidas" className="py-32 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-6 mb-20">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-200" />
            <h3 className="text-3xl font-bold text-slate-950 tracking-tight">Perguntas Frequentes</h3>
          </div>
          <div className="space-y-4">
            {[
              { q: "A simulação funciona no celular?", a: "Sim, o Colora é totalmente responsivo. Funciona em qualquer navegador de smartphone (iPhone ou Android) sem precisar baixar nada." },
              { q: "Posso usar as cores da minha marca de tinta?", a: "Com certeza. Você pode subir o catálogo CSV da marca que revende ou cadastrar cores manuais com códigos Hexadecimal/RGB." },
              { q: "O white-label está incluso?", a: "Sim. Acreditamos que a sua marca deve estar em primeiro lugar. Em todos os planos você personaliza logo, cores e tipografia." },
              { q: "Como o PDF é gerado?", a: "Após a simulação, o vendedor clica em 'Exportar' e o sistema gera automaticamente um PDF com a foto do ambiente pintado, o nome das cores usadas e os dados da sua loja." }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden transition-all hover:border-slate-200">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-8 py-6 text-left flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-widest group-hover:text-primary transition-colors">{faq.q}</span>
                  <ChevronRight className={cn("w-5 h-5 text-slate-300 transition-transform duration-300", openFaq === i ? "rotate-90" : "")} />
                </button>
                <div className={cn("px-8 transition-all duration-300 ease-in-out", openFaq === i ? "max-h-40 pb-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-24 px-8 border-t border-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16 pb-20 border-b border-slate-100">
            <div className="space-y-6 text-center md:text-left">
              <img src={logoSvg} alt="Colora" className="h-10 mx-auto md:mx-0 opacity-90" />
              <p className="text-slate-400 font-medium max-w-sm">Redefinindo a estética da simulação de tintas. <br />Potencializado por IA, desenhado para o varejo brasileiro.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              <div className="space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 font-mono">Produto</h5>
                <ul className="space-y-4">
                   {["Simulador", "Preços", "Dúvidas"].map(item => <li key={item}><a href={`#${item === "Simulador" ? "experiencia" : item === "Preços" ? "estrategia" : "duvidas"}`} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{item}</a></li>)}
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 font-mono">Jurídico</h5>
                <ul className="space-y-4">
                   {["Termos", "Privacidade"].map(item => <li key={item}><Link to={item === "Termos" ? "/terms" : "/privacy"} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{item}</Link></li>)}
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="flex flex-col gap-2 text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">© 2026 Colora IA · CNPJ 54.321.987/0001-00</p>
             </div>
             <div className="flex items-center gap-10 grayscale opacity-30">
                <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe" className="h-5" />
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingV2;
