import { Link } from "react-router-dom";
import {
  Upload, Palette, Eye, Layers, Sparkles, Monitor, ArrowRight, Check,
  Zap, Shield, Users, Star, ChevronRight, Store, FileDown, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroRoom from "@/assets/hero-room.jpg";
import logoSvg from "@/assets/colora-logo.svg";

const stats = [
  { value: "2s", label: "Simulação com IA" },
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
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSvg} alt="Logotipo Colora" className="w-32" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Área da Loja</Link>
            </Button>
            <Button size="sm" asChild className="gradient-secondary text-foreground font-bold border-0 hover:opacity-90">
              <Link to="/login">Assinar Agora</Link>
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
                style={{ background: "linear-gradient(90deg, hsl(96 66% 64% / 0.15), hsl(202 86% 58% / 0.15))", color: "hsl(202 86% 48%)" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Simulação com Inteligência Artificial
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-display font-bold leading-[1.1] text-foreground">
                Venda mais tinta com{" "}
                <span className="text-gradient">simulação de cor por IA</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Seus clientes veem o resultado antes de comprar. Menos devoluções,
                mais confiança e um atendimento que nenhum concorrente oferece.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" asChild className="gap-2 text-base px-6 gradient-secondary text-foreground font-bold border-0 hover:opacity-90 shadow-lg">
                  <Link to="/login">
                    Assinar por R$ 59,90/mês <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-6">
                  <Link to="/login">Área da Loja</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                200 simulações inclusas · Sem fidelidade · Cancele quando quiser
              </p>
            </div>
            <div className="opacity-0 animate-fade-in-delay-2 relative">
              <div className="rounded-2xl overflow-hidden shadow-elevated border border-border relative">
                {/* Gradient border glow */}
                <div className="absolute -inset-[1px] rounded-2xl opacity-40 -z-10 blur-sm"
                  style={{ background: "var(--gradient-primary)" }} />
                <img
                  src={heroRoom}
                  alt="Ambiente moderno simulado com cores de tinta"
                  className="w-full h-auto"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-5 -left-4 bg-card rounded-xl p-3 shadow-elevated border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "#50C878" }} />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Cor aplicada</p>
                  <p className="text-sm font-bold text-foreground">Verde Esmeralda</p>
                </div>
              </div>
              {/* AI badge */}
              <div className="absolute -top-3 -right-3 bg-card rounded-lg px-3 py-2 shadow-elevated border border-border flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "hsl(202 86% 58%)" }} />
                <span className="text-xs font-bold text-foreground">IA em 2s</span>
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
                  <h3 className="text-base font-display font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-border z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-wider mb-2 text-gradient inline-block">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Tudo que sua loja precisa
            </h2>
            <p className="text-muted-foreground text-lg">Ferramenta completa para vender mais e melhor</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const colors = [
                "hsl(300 77% 41%)",
                "hsl(202 86% 58%)",
                "hsl(96 66% 64%)",
                "hsl(61 66% 64%)",
                "hsl(358 89% 59%)",
                "hsl(202 86% 58%)",
              ];
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-border bg-card hover:shadow-elevated transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${colors[i]}15` }}>
                    <feat.icon className="w-5 h-5" style={{ color: colors[i] }} />
                  </div>
                  <h3 className="text-base font-display font-bold text-foreground mb-1.5">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
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
            <Button className="w-full text-base font-bold gradient-secondary text-foreground border-0 hover:opacity-90" size="lg" asChild>
              <Link to="/login">
                Assinar Agora <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Sem fidelidade · Cancele a qualquer momento
            </p>
          </div>
        </div>
      </section>

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
          <Button size="lg" asChild className="gap-2 text-base px-8 font-bold gradient-primary text-foreground border-0 hover:opacity-90 shadow-lg">
            <Link to="/login">
              Assinar por R$ 59,90/mês <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1 w-full gradient-primary" />

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="Logotipo Colora" className="w-20" />
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Colora. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;