import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Upload, Palette, Layers, Sparkles, Monitor, ArrowRight, Check,
  Shield, Users, Star, Store, FileDown, Smartphone, Video, X,
  Mail, Phone, MapPin, Instagram, Linkedin, Play, MousePointer2, ExternalLink, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroWhite from "@/assets/HeroWhite.jpg";
import heroYellowstone from "@/assets/HeroYellowstone.jpg";
import heroTiffany from "@/assets/HeroTiffany.jpg";
import logoSvg from "@/assets/colora-logo.svg";
import { cn } from "@/lib/utils";

const stats = [
  { value: "Instantâneo", label: "Renderização IA", icon: Sparkles },
  { value: "200+", label: "Lojas Parceiras", icon: Store },
  { value: "White-label", label: "Sua Identidade", icon: Monitor },
  { value: "PDF", label: "Proposta Estética", icon: FileDown },
];

const steps = [
  {
    icon: Upload,
    title: "Início",
    desc: "A foto do ambiente é o ponto de partida para a criação.",
  },
  {
    icon: Palette,
    title: "Curadoria",
    desc: "Navegue por tonalidades que compõem sua marca.",
  },
  {
    icon: Sparkles,
    title: "Harmonia",
    desc: "A inteligência aplica a cor com suavidade e precisão.",
  },
  {
    icon: FileDown,
    title: "Entrega",
    desc: "Um convite visual pronto para inspirar seu cliente.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Finesse Tecnológica",
    desc: "Sombras e texturas preservadas para um realismo quase tátil.",
  },
  {
    icon: Monitor,
    title: "Presença Digital",
    desc: "Uma extensão fluida da sua loja no ambiente online.",
  },
  {
    icon: Smartphone,
    title: "Mobilidade Leve",
    desc: "Perfeito para o atendimento próximo, lado a lado com o cliente.",
  },
  {
    icon: Store,
    title: "Personalização",
    desc: "Seus catálogos integrados de forma limpa e organizada.",
  },
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const roomImages = [
    {
      src: heroWhite,
      colorName: "Branco Minimalista",
      colorCode: "#F8F9FA",
      description: "A pureza do espaço original."
    },
    {
      src: heroYellowstone,
      colorName: "Sândalo Suave",
      colorCode: "#E5D1B8",
      description: "Aqueça o ambiente com elegância."
    },
    {
      src: heroTiffany,
      colorName: "Brisa Serena",
      colorCode: "#A8DADC",
      description: "Leveza e frescor em cada detalhe."
    }
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    const interval = setInterval(() => {
      if (document.hidden) return;
      setCurrentImage((prev) => (prev + 1) % roomImages.length);
    }, 6000);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [roomImages.length]);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/5 selection:text-primary overflow-x-hidden tracking-tight text-slate-700">
      {/* Navbar Minimalista */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-6",
        scrolled ? "py-4" : "py-8"
      )}>
        <div className={cn(
          "container mx-auto max-w-6xl flex items-center justify-between px-8 h-14 rounded-full transition-all duration-700",
          scrolled ? "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100" : "bg-transparent"
        )}>
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src={logoSvg} alt="Colora" className="h-6 sm:h-7" />
          </Link>
          
          <div className="hidden md:flex items-center gap-12">
            {["Funcionalidades", "Estética", "Planos"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] font-medium text-slate-400 hover:text-primary transition-colors tracking-widest uppercase">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden sm:block text-[13px] font-medium text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
              Área do cliente
            </Link>
            <Button variant="outline" size="sm" asChild className="rainbow-border h-9 px-6 rounded-full font-medium text-[12px] uppercase tracking-widest border-none shadow-none hover:shadow-sm transition-all duration-500">
              <Link to="/checkout">
                Assinar
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Reduzida e Aérea */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[30%] h-[30%] rounded-full bg-blue-50/40 blur-[100px]" />
          <div className="absolute bottom-[20%] right-[15%] w-[25%] h-[25%] rounded-full bg-purple-50/40 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-12 animate-fade-in">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-50/50 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <Sparkles className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">Harmonia Visual & IA</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light leading-[1.15] text-slate-800 tracking-tight">
                A beleza de simular <br />
                <span className="text-gradient-subtle font-normal italic">novas atmosferas</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed font-light tracking-normal">
                Uma experiência fluida para transformar a percepção de cor e encantar seus clientes com delicadeza técnica.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Button variant="default" size="lg" asChild className="h-12 px-10 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-light tracking-widest text-[13px] uppercase transition-all shadow-none">
                <Link to="/checkout">
                  Começar Experiência
                </Link>
              </Button>
              <button 
                onClick={() => setShowVideoModal(true)}
                className="flex items-center gap-3 px-8 text-slate-400 hover:text-slate-600 transition-all text-[13px] uppercase tracking-widest font-medium"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white">
                  <Play className="w-3 h-3 fill-slate-400 text-slate-400" />
                </div>
                Ver Demo
              </button>
            </div>

            {/* Mockup Refinado */}
            <div className="relative w-full max-w-4xl pt-12">
              <div className="relative bg-white rounded-[2rem] p-2 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-50 overflow-hidden">
                <div className="relative aspect-[16/10] rounded-[1.5rem] overflow-hidden group">
                  {roomImages.map((image, index) => (
                    <div
                      key={index}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-[1500ms] ease-in-out",
                        index === currentImage ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <img src={image.src} alt={image.colorName} className="w-full h-full object-cover" />
                    </div>
                  ))}

                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-sm max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full shadow-inner border border-black/5 transition-all duration-1000" 
                          style={{ backgroundColor: roomImages[currentImage].colorCode }}
                        />
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-none">Simulação Atual</p>
                          <p className="text-sm font-medium text-slate-800 tracking-tight">{roomImages[currentImage].colorName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {roomImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={cn(
                            "h-1 rounded-full transition-all duration-1000",
                            i === currentImage ? "bg-slate-800 w-8" : "bg-slate-200 w-2 hover:bg-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Mais sutis */}
      <section className="py-20 border-y border-slate-50">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center space-y-3">
                <p className="text-2xl font-light text-slate-800 tracking-tight">{s.value}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona - Minimalista */}
      <section id="estética" className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.4em] text-slate-300">Simplicidade Fluida</h2>
            <h3 className="text-3xl md:text-4xl font-light text-slate-800 tracking-tight">O percurso da inspiração</h3>
          </div>

          <div className="grid md:grid-cols-4 gap-16">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-6">
                <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-primary transition-all duration-500">
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[13px] font-medium uppercase tracking-widest text-slate-800">{step.title}</h4>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Dark Refinado */}
      <section id="funcionalidades" className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-16">
              <div className="space-y-6">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.4em] text-slate-500">Infraestrutura Invisível</h2>
                <h3 className="text-3xl md:text-5xl font-light text-white leading-tight">Tecnologia que <br />respeita a visão.</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-12">
                {features.map((f, i) => (
                  <div key={i} className="space-y-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                      <f.icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-[13px] font-medium uppercase tracking-widest text-white">{f.title}</h4>
                    <p className="text-slate-500 leading-relaxed text-[13px] font-light">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/5 opacity-80">
              <img src={heroTiffany} alt="Estética" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Planos - Leveza */}
      <section id="planos" className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center space-y-16">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.4em] text-slate-300">Investimento</h2>
              <h3 className="text-3xl md:text-4xl font-light text-slate-800 tracking-tight">O plano para sua evolução</h3>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-10 relative group hover:border-slate-200 transition-all duration-700">
              <div className="text-center space-y-4">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em]">Assinatura Profissional</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-light text-slate-800 tracking-tighter">R$ 59</span>
                  <div className="text-left ml-1">
                    <p className="text-xl font-light text-slate-800">,90</p>
                    <p className="text-slate-300 font-medium text-[10px] uppercase tracking-widest">/mês</p>
                  </div>
                </div>
              </div>

              <div className="h-px w-8 mx-auto bg-slate-100" />

              <ul className="space-y-5 text-center">
                {[
                  "200 Simulações IA de alta fidelidade",
                  "Catálogos de marcas ilimitados",
                  "Plataforma White-Label",
                  "Propostas Visuais em PDF"
                ].map((item, i) => (
                  <li key={i} className="text-slate-400 font-light text-sm tracking-normal">
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="default" size="lg" asChild className="w-full h-12 rounded-full bg-slate-800 hover:bg-slate-900 text-[12px] uppercase tracking-[0.2em] font-medium transition-all shadow-none">
                <Link to="/checkout">Ativar Simulador</Link>
              </Button>
              
              <div className="flex items-center justify-center gap-3 text-[9px] font-medium text-slate-300 uppercase tracking-widest">
                <Lock className="w-3 h-3" />
                Segurança Stripe de ponta a ponta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Profissional */}
      <footer className="bg-slate-950 pt-24 pb-12 text-white/90">
        <div className="container mx-auto max-w-6xl px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5 space-y-8">
              <img src={logoSvg} alt="Colora" className="h-7 brightness-0 invert opacity-90" />
              <p className="text-slate-500 text-lg font-light leading-relaxed max-w-sm">
                Inovação estética para o varejo moderno de tintas e revestimentos.
              </p>
              <div className="flex gap-4">
                {[Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-6">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">Navegação</h4>
              <ul className="space-y-4">
                {["Funcionalidades", "Planos", "Estética"].map(item => (
                  <li key={item}><a href="#" className="text-slate-400 text-[13px] font-light hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 space-y-6">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">Contato</h4>
              <ul className="space-y-4 text-[13px] font-light text-slate-400">
                <li className="flex items-center gap-4">
                  <Mail className="w-4 h-4 opacity-30" />
                  contato@colora.com.br
                </li>
                <li className="flex items-center gap-4">
                  <Phone className="w-4 h-4 opacity-30" />
                  (11) 91234-5678
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-left space-y-2">
              <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                © 2026 Colora IA. CNPJ: 54.321.987/0001-00
              </p>
              <p className="text-[9px] text-slate-700 font-medium uppercase tracking-tighter">Powered by Stripe & Google Cloud</p>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe" className="h-5 invert" />
              </div>
              <div className="flex items-center gap-3 py-2 px-4 rounded-xl border border-white/5 bg-white/5">
                <Shield className="w-4 h-4 text-emerald-500/70" />
                <div className="text-left">
                  <p className="text-[9px] font-bold text-white uppercase tracking-widest leading-none mb-1">Pagamento Seguro</p>
                  <p className="text-[8px] font-medium text-slate-500 uppercase leading-none">Ambiente Criptografado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full overflow-hidden animate-in zoom-in duration-500 shadow-2xl">
            <div className="p-8 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-800 uppercase tracking-widest">A Harmonia das Cores</h3>
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
                  <p className="text-slate-400 font-light text-lg">Assista à delicadeza do Colora em ação.</p>
               </div>
            </div>

            <div className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8 bg-white border-t border-slate-50">
               <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xl font-light text-slate-800">Pronto para elevar sua loja?</p>
                  <p className="text-slate-400 text-sm font-light">Ativação imediata para sua marca.</p>
               </div>
               <Button variant="default" size="lg" asChild className="rounded-full px-12 h-12 bg-slate-800 shadow-none">
                  <Link to="/checkout" className="text-[12px] uppercase tracking-widest">Assinar Agora</Link>
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
