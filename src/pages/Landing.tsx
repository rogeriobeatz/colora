import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Upload, Palette, Eye, Layers, Sparkles, Monitor, ArrowRight, Check,
  Zap, Shield, Users, Star, ChevronRight, Store, FileDown, Smartphone, Play, Video, X,
  Mail, Phone, MapPin, Instagram, Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroRoom from "@/assets/hero-room.jpg";
import heroWhite from "@/assets/HeroWhite.jpg";
import heroYellowstone from "@/assets/HeroYellowstone.jpg";
import heroTiffany from "@/assets/HeroTiffany.jpg";
import logoSvg from "@/assets/colora-logo.svg";

const stats = [
  { value: "Rápido", label: "Simulação com IA" },
  { value: "200", label: "Simulações/mês" },
  { value: "100%", label: "White-label" },
  { value: "PDF", label: "Proposta pronta" },
];

const steps = [
  {
    icon: Upload,
    title: "Envie a foto",
    desc: "O cliente tira uma foto do cômodo pelo celular ou você sobe do computador.",
  },
  {
    icon: Palette,
    title: "Escolha a cor",
    desc: "Selecione do seu catálogo personalizado de marcas e tonalidades.",
  },
  {
    icon: Sparkles,
    title: "IA aplica a cor",
    desc: "Em segundos, a inteligência artificial pinta a parede com realismo profissional.",
  },
  {
    icon: FileDown,
    title: "Gere o PDF",
    desc: "Entregue uma proposta visual com o antes e depois, pronta para fechar a venda.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "IA Realista",
    desc: "Aplicação de cor inteligente que respeita sombras, texturas e iluminação do ambiente real.",
  },
  {
    icon: Monitor,
    title: "White-label Completo",
    desc: "Link exclusivo com sua marca, logo, cores e domínio. Seu cliente nunca vê 'Colora'.",
  },
  {
    icon: Layers,
    title: "Múltiplas Simulações",
    desc: "Compare várias cores lado a lado no mesmo ambiente e ajude o cliente a decidir.",
  },
  {
    icon: Store,
    title: "Catálogos Personalizados",
    desc: "Crie catálogos com as marcas que você vende. Importação em massa via CSV.",
  },
  {
    icon: FileDown,
    title: "PDF Profissional",
    desc: "Gere propostas em PDF com antes/depois e dados da sua loja. Impressione no atendimento.",
  },
  {
    icon: Smartphone,
    title: "Funciona no Celular",
    desc: "Interface responsiva. O vendedor simula direto no balcão, sem precisar de computador.",
  },
];

const benefits = [
  "Feche mais vendas com visualização realista",
  "Reduza devoluções e trocas de cor",
  "Destaque sua loja da concorrência",
  "Atendimento mais rápido e profissional",
  "Fidelização com experiência premium",
  "Sem necessidade de treinamento técnico",
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const roomImages = [
    {
      src: heroWhite,
      colorName: "Branco Original",
      colorCode: "#FFFFFF",
      description: "Sofisticação e claridade para qualquer ambiente"
    },
    {
      src: heroYellowstone,
      colorName: "Amarelo Queimado",
      colorCode: "#D4A574",
      description: "Aconchego e elegância com toque rústico"
    },
    {
      src: heroTiffany,
      colorName: "Azul Tiffany",
      colorCode: "#78C2D9",
      description: "Serenidade e estilo contemporâneo"
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      // 🔴 OTIMIZADO: Pausar se página não estiver visível
      if (document.hidden) return;
      setCurrentImage((prev) => (prev + 1) % roomImages.length);
    }, 6000); // ✅ Aumentado de 4s para 6s - menos requisições
    
    return () => clearInterval(interval);
  }, []);

  const handleImageChange = (index: number) => {
    setCurrentImage(index);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSvg} alt="Logotipo Colora" className="w-32" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="z-99">
              <Link to="/login">Área da Loja</Link>
            </Button>
            <Button variant="gradient-secondary" size="lg" asChild className="button-glow button-pulse">
              <Link to="/checkout">
                Assinar Agora <ArrowRight className="w-4 h-4 ml-2" />
                {/* <div className="button-shine" /> */}
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(96 66% 64% / 0.6), transparent 70%)" }} />
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(202 86% 58% / 0.6), transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(300 77% 41% / 0.5), transparent 70%)" }} />

        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 opacity-0 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ background: "linear-gradient(90deg, hsl(96 66% 64% / 0.15), hsl(202 86% 58% / 0.15))", color: "hsla(0, 0%, 3%, 1.00)" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Simulação com Inteligência Artificial
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-display font-light leading-[1.1] text-foreground">
                Venda mais tintas com {" "}
                <span className="text-gradient font-bold">simulação de cor por IA</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Seus clientes veem o resultado antes de comprar. Menos devoluções,
                mais confiança e um atendimento que nenhum concorrente oferece.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="gradient-secondary" size="lg" asChild className="button-glow">
                  <Link to="/checkout">
                    Assinar por R$ 59,90/mês <ArrowRight className="w-4 h-4" />
                    <div className="button-shine" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-6 hover:scale-105 active:scale-95 transition-all duration-300">
                  <Link to="/login" onClick={(e) => { e.preventDefault(); setShowVideoModal(true); }}>
                    <Video className="w-4 h-4 mr-2" />
                    Assistir ao vídeo
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                200 simulações inclusas · Sem fidelidade · Cancele quando quiser
              </p>
            </div>
            <div className="opacity-0 animate-fade-in-delay-2 relative">
              <div className="rounded-2xl shadow-elevated border border-border relative">
                {/* Gradient border glow */}
                <div className="absolute -inset-[1px] rounded-2xl opacity-40 -z-10 blur-sm"
                  style={{ background: "var(--gradient-primary)" }} />
                
                {/* Carousel Container */}
                <div className="relative h-[400px] md:h-[500px]">
                  {roomImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentImage ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <img
                        src={image.src}
                        alt={`Ambiente com cor ${image.colorName}`}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Floating Color Card */}
                <div className="absolute -bottom-5 -left-4 bg-card rounded-xl p-3 shadow-elevated border border-border flex items-center gap-3 transition-all duration-500">
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-border" 
                    style={{ backgroundColor: roomImages[currentImage].colorCode }}
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Cor aplicada</p>
                    <p className="text-sm font-bold text-foreground">{roomImages[currentImage].colorName}</p>
                  </div>
                </div>

                {/* Color Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-card/90 backdrop-blur-sm rounded-full px-3 py-2 border border-border">
                  {roomImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageChange(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImage 
                          ? 'bg-primary w-6' 
                          : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                      }`}
                      aria-label={`Ver imagem ${index + 1}`}
                    />
                  ))}
                </div>


                {/* AI Badge */}
                {/* <div className="absolute -top-3 -right-3 bg-card rounded-lg px-3 py-2 shadow-elevated border border-border flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "hsl(202 86% 58%)" }} />
                  <span className="text-xs font-bold text-foreground">Simulação em segundos</span>
                </div> */}

                {/* Color Description */}
                <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border max-w-[200px] transition-all duration-500">
                  <p className="text-xs text-muted-foreground italic">{roomImages[currentImage].description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-fade-in-delay-3">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-card border border-border hover:shadow-elevated transition-all">
                <p className="text-2xl md:text-3xl font-display font-bold text-gradient">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: "var(--gradient-primary)" }} />
        <div className="container mx-auto max-w-4xl text-center relative">
          <p className="text-sm font-bold uppercase tracking-wider mb-2 text-gradient inline-block">O problema</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Seu cliente tem medo de errar a cor
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Toda loja de tinta perde vendas porque o cliente não consegue visualizar o resultado.
            Com o Colora, essa barreira desaparece — e a venda acontece com confiança.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
              <p className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-destructive text-lg">✗</span> Sem simulador
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Cliente inseguro sobre a cor</li>
                <li>• Devoluções e trocas frequentes</li>
                <li>• Atendimento demorado</li>
                <li>• Loja igual a todas as outras</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border-2 relative overflow-hidden"
              style={{ borderImage: "var(--gradient-primary) 1" }}>
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: "var(--gradient-primary)" }} />
              <p className="font-display font-bold text-foreground mb-3 flex items-center gap-2 relative">
                <span className="text-gradient text-lg font-bold">✓</span> Com Colora
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground relative">
                <li>• Visualização realista antes de comprar</li>
                <li>• Zero dúvidas na hora da compra</li>
                <li>• Proposta em PDF na hora</li>
                <li>• Experiência premium para o cliente</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-wider mb-2 text-gradient inline-block">Passo a passo</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Simples de usar, impossível de ignorar
            </h2>
            <p className="text-muted-foreground text-lg">4 passos para transformar o atendimento da sua loja</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const colors = [
                "hsl(61 66% 64%)",
                "hsl(96 66% 64%)",
                "hsl(202 86% 58%)",
                "hsl(358 89% 59%)",
              ];
              return (
                <div
                  key={i}
                  className="relative p-6 rounded-2xl bg-background border border-border hover:shadow-elevated transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${colors[i]}20` }}>
                      <step.icon className="w-5 h-5" style={{ color: colors[i] }} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Passo {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-border z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits checklist */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider mb-2 text-gradient inline-block">Por que usar</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                O diferencial que sua loja precisa
              </h2>
              <ul className="space-y-4">
                {benefits.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                      style={{ background: "linear-gradient(135deg, hsl(96 66% 64% / 0.2), hsl(202 86% 58% / 0.2))" }}>
                      <Check className="w-3.5 h-3.5" style={{ color: "hsl(202 86% 58%)" }} />
                    </div>
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: "var(--gradient-primary)" }} />
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "hsl(300 77% 41%)" }} />
              <p className="text-4xl font-display font-bold text-gradient mb-1 relative">+300</p>
              <p className="text-muted-foreground font-medium relative">Lojas já usam o Colora</p>
              <div className="flex items-center justify-center gap-0.5 mt-4 relative">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: "hsl(61 66% 54%)" }} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2 relative italic">"Vendemos 40% mais tinta com a simulação"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "var(--gradient-primary)" }} />
        <div className="container mx-auto max-w-lg relative">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-wider mb-2 text-gradient inline-block">Investimento</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Plano simples, resultado direto
            </h2>
            <p className="text-muted-foreground">Sem surpresas. Cancele quando quiser.</p>
          </div>
          <div className="rounded-2xl bg-background p-8 relative overflow-hidden shadow-xl">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl p-[2px] -z-10"
              style={{ background: "var(--gradient-primary)" }}>
              <div className="w-full h-full rounded-[calc(1rem-2px)] bg-background" />
            </div>
            <div className="text-center mb-6">
              <p className="text-sm font-bold text-gradient inline-block mb-1">Profissional</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-display font-bold text-foreground">R$ 59,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Menos que uma lata de tinta</p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "200 simulações com IA por mês",
                "Catálogos personalizados ilimitados",
                "White-label com sua marca",
                "Link exclusivo para clientes",
                "Importação/Exportação CSV",
                "Geração de PDF profissional",
                "Funciona no celular e desktop",
                "Suporte prioritário",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(96 66% 50%)" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Button variant="gradient-secondary" size="lg" className="w-full button-glow" asChild>
              <Link to="/checkout">
                Assinar Agora <ArrowRight className="w-4 h-4 ml-2" />
                <div className="button-shine" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Sem fidelidade · Cancele a qualquer momento
            </p>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-display font-bold text-foreground">Demonstração Colora</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/100 transform hover:scale-110 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Content */}
            <div className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div className="flex items-center justify-center h-full">
                  <p className="text-white text-lg mb-4">🎬 Vídeo Demonstrativo</p>
                  <p className="text-white/80 text-center">Veja como o Colora transforma qualquer ambiente em segundos</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="p-6 bg-muted/50">
              <h4 className="text-lg font-display font-bold text-foreground mb-2">Pronto para transformar sua loja?</h4>
              <p className="text-muted-foreground mb-4">Assine agora e comece a vender mais com simulação realista</p>
              <Button variant="gradient-secondary" size="lg" className="w-full button-glow button-shine" asChild>
                <Link to="/checkout">
                  Assinar Agora <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ background: "var(--gradient-primary)" }} />
        <div className="container mx-auto max-w-3xl text-center relative">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Pronto para vender mais tinta?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Assine o Colora e comece a impressionar seus clientes hoje mesmo.
          </p>
          <Button variant="gradient-secondary" size="lg" asChild className="button-glow button-pulse">
            <Link to="/checkout">
              Assinar por R$ 59,90/mês <ArrowRight className="w-4 h-4" />
              <div className="button-shine" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1 w-full gradient-primary" />

      {/* Footer */}
      <footer className="bg-card pt-16 pb-8 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-2">
                <img src={logoSvg} alt="Logotipo Colora" className="w-32" />
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Transformando a experiência de compra de tintas com inteligência artificial. 
                Simule cores reais em ambientes reais com precisão profissional.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-display font-bold text-foreground mb-6">Produto</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/checkout" className="hover:text-primary transition-colors">Assinar Agora</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Área da Loja</Link></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-display font-bold text-foreground mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="font-display font-bold text-foreground mb-6">Contato</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>contato@colora.com.br</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>(11) 99999-9999</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>São Paulo, SP</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 Colora. Todos os direitos reservados. 
              COLORA TECNOLOGIA LTDA - CNPJ: 00.000.000/0001-00
            </p>
            <div className="flex items-center gap-6">
              <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe" className="h-4 grayscale opacity-50" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;