import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Upload, Palette, Layers, Sparkles, Monitor, ArrowRight, Check,
  Shield, Users, Star, Store, FileDown, Video, X,
  Mail, Phone, Instagram, Linkedin, Play, MousePointer2, ExternalLink, Lock,
  HelpCircle, ShieldCheck
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
  { value: "PDF", label: "Orçamento Visual", icon: FileDown },
];

const faqs = [
  {
    q: "Funciona com qualquer marca de tinta?",
    a: "Sim. Você pode importar catálogos de qualquer fabricante via CSV ou cadastrar suas cores personalizadas manualmente."
  },
  {
    q: "O cliente precisa baixar algum aplicativo?",
    a: "Não. O simulador funciona 100% no navegador, tanto em computadores quanto em celulares (iOS e Android)."
  },
  {
    q: "Como funciona o White-Label?",
    a: "Você sobe sua logo, escolhe suas cores e o sistema gera um link exclusivo onde o cliente vê apenas a sua marca."
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Não temos contratos de fidelidade. Você paga o mês e, se não quiser continuar, cancela com um clique no painel."
  }
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const roomImages = [
    {
      src: heroWhite,
      colorName: "Branco Minimalista",
      colorCode: "#F8F9FA",
      label: "Original"
    },
    {
      src: heroYellowstone,
      colorName: "Sândalo Suave",
      colorCode: "#E5D1B8",
      label: "Tons Quentes"
    },
    {
      src: heroTiffany,
      colorName: "Brisa Serena",
      colorCode: "#A8DADC",
      label: "Tons Frios"
    }
  ];

  useEffect(() => {
    document.body.classList.add('landing-page');
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove('landing-page');
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/5 selection:text-primary overflow-x-hidden tracking-tight text-slate-700">
      
      {/* Sticky CTA Mobile */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[110] p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 flex gap-3 md:hidden transition-transform duration-500",
        scrolled ? "translate-y-0" : "translate-y-full"
      )}>
        <Button variant="default" size="lg" asChild className="flex-1 rounded-full bg-slate-800 text-[12px] uppercase tracking-widest font-medium h-12">
          <Link to="/checkout">Assinar Agora</Link>
        </Button>
      </div>

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
            <a href="#funcionalidades" className="text-[13px] font-medium text-slate-400 hover:text-primary transition-colors tracking-widest uppercase">Funcionalidades</a>
            <a href="#proposta" className="text-[13px] font-medium text-slate-400 hover:text-primary transition-colors tracking-widest uppercase">Resultados</a>
            <a href="#faq" className="text-[13px] font-medium text-slate-400 hover:text-primary transition-colors tracking-widest uppercase">Dúvidas</a>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden sm:block text-[13px] font-medium text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
              Área do cliente
            </Link>
            <Button variant="outline" size="sm" asChild className="rainbow-border h-9 px-6 rounded-full font-medium text-[12px] uppercase tracking-widest border-none shadow-none hover:shadow-sm transition-all duration-500">
              <Link to="/checkout">Assinar</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Aérea */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center animate-fade-in">
            <div className="space-y-10 text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-50 border border-slate-100">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">Harmonia Visual & IA</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-light leading-[1.15] text-slate-800 tracking-tight">
                  A beleza de simular <br />
                  <span className="text-gradient-subtle font-normal italic">novas atmosferas</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed font-light">
                  Uma experiência fluida para transformar a percepção de cor e encantar seus clientes com delicadeza técnica.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <Button variant="default" size="lg" asChild className="h-12 px-10 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-light tracking-widest text-[13px] uppercase transition-all shadow-none">
                  <Link to="/checkout">Começar Experiência</Link>
                </Button>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-all text-[13px] uppercase tracking-widest font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
                    <Play className="w-3 h-3 fill-slate-400 text-slate-400" />
                  </div>
                  Ver Demo
                </button>
              </div>
            </div>

            {/* Mockup Interativo Minimalista */}
            <div className="relative group">
              <div className="relative bg-white rounded-[2.5rem] p-2 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-50 overflow-hidden">
                <div className="relative aspect-[4/5] sm:aspect-square rounded-[2rem] overflow-hidden">
                  {roomImages.map((image, index) => (
                    <img
                      key={index}
                      src={image.src}
                      alt={image.colorName}
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                        index === currentImage ? "opacity-100" : "opacity-0"
                      )}                    />
                  ))}
                  
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/80 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
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
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3 animate-bounce-slow">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Fechado com IA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Sutis */}
      <section className="py-20 border-y border-slate-50">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center space-y-3">
                <p className="text-2xl font-light text-slate-800 tracking-tight">{s.value}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Dor vs Solução */}
      <section id="proposta" className="py-24 bg-slate-50/50">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-left">
              <h3 className="text-3xl font-light text-slate-800 tracking-tight">O fim da indecisão no balcão</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full border border-red-100 flex items-center justify-center text-red-400 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Processo Antigo</p>
                    <p className="text-sm text-slate-400 font-light">Leques de cores confusos, amostras caras e clientes inseguros.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full border border-green-100 flex items-center justify-center text-green-400 flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">Efeito Colora</p>
                    <p className="text-sm text-slate-500 font-light">Visualização instantânea e confiança total para fechar o pedido.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                <FileDown className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-light">Orçamento Visual Premium</h4>
              <p className="text-slate-400 font-light text-sm leading-relaxed">
                Ao final da simulação, gere um PDF profissional com sua logo e a foto do ambiente pintado. O cliente leva a inspiração com o seu contato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Inteligente */}
      <section id="faq" className="py-24 bg-white">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center mb-16 space-y-4">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-200" />
            <h3 className="text-3xl font-light text-slate-800 tracking-tight">Perguntas Frequentes</h3>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-500 hover:border-slate-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center"
                >
                  <span className="text-[14px] font-medium text-slate-700 uppercase tracking-widest">{faq.q}</span>
                  <div className={cn("transition-transform duration-300", openFaq === i ? "rotate-45" : "")}>
                    <PlusIcon className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
                <div className={cn(
                  "px-8 transition-all duration-500 ease-in-out",
                  openFaq === i ? "max-h-40 pb-8 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços - Leveza */}
      <section id="planos" className="py-24 bg-slate-50/30">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center space-y-16">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.4em] text-slate-300">Investimento</h2>
              <h3 className="text-3xl md:text-4xl font-light text-slate-800 tracking-tight leading-tight">O custo de uma lata de tinta, <br />o valor de centenas de vendas.</h3>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-10 relative group hover:border-slate-200 transition-all duration-700">
              <div className="text-center space-y-4">
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
                  "Plataforma 100% White-Label",
                  "Propostas Visuais em PDF"
                ].map((item, i) => (
                  <li key={i} className="text-slate-400 font-light text-sm tracking-normal">
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="default" size="lg" asChild className="w-full h-12 rounded-full bg-slate-800 hover:bg-slate-900 text-[12px] uppercase tracking-[0.2em] font-medium transition-all shadow-none">
                <Link to="/checkout">Quero vender com IA</Link>
              </Button>
              
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Cancelamento em 1 clique
                </div>
                <div className="flex items-center justify-center gap-4 opacity-40">
                  <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe" className="h-4 grayscale" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Profissional */}
      <footer className="bg-slate-950 pt-24 pb-12 text-white/90">
        <div className="container mx-auto max-w-6xl px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5 space-y-8 text-left">
              <img src={logoSvg} alt="Colora" className="h-7 brightness-0 invert opacity-90" />
              <p className="text-slate-500 text-lg font-light leading-relaxed max-w-sm">
                A tecnologia que une inspiração estética e decisão comercial.
              </p>
              <div className="flex gap-4">
                {[Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-6 text-left">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">Plataforma</h4>
              <ul className="space-y-4">
                {["Funcionalidades", "Resultados", "Planos"].map(item => (
                  <li key={item}><a href="#" className="text-slate-400 text-[13px] font-light hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 space-y-6 text-left">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">Contato</h4>
              <ul className="space-y-4 text-[13px] font-light text-slate-400">
                <li className="flex items-center gap-4">
                  <Mail className="w-4 h-4 opacity-30" />
                  contato@colora.app.br
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-left space-y-2">
              <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                © {new Date().getFullYear()} Colora IA. Todos os direitos reservados.
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
                <h3 className="text-sm font-medium text-slate-800 uppercase tracking-widest">Simulação na Prática</h3>
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
                  <p className="text-slate-400 font-light text-lg">Assista à demonstração técnica do Colora.</p>
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

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default Landing;
