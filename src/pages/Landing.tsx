import { Link } from "react-router-dom";
import { Upload, Palette, Eye, Layers, Sparkles, Monitor, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroRoom from "@/assets/hero-room.jpg";
import logoSvg from "./public/colora-logo.svg"


const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Colora</span>
            <img src={logoSvg }/>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Área da Loja</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 opacity-0 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Simulação com Inteligência Artificial
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-foreground">
                Transforme Ambientes com{" "}
                <span className="text-gradient">Cores Perfeitas</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Simulação de cores com IA para lojas de tinta impressionarem seus clientes. 
                Experiência rápida, visual impactante e fácil operação.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" asChild className="gap-2">
                  <Link to="/login">
                    Criar Conta <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Área da Loja</Link>
                </Button>
              </div>
            </div>
            <div className="opacity-0 animate-fade-in-delay-2 relative">
              <div className="rounded-2xl overflow-hidden shadow-elevated">
                <img src={heroRoom} alt="Ambiente moderno para simulação de cores" className="w-full h-auto" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-3 shadow-elevated border border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "#50C878" }} />
                <div>
                  <p className="text-xs text-muted-foreground">Cor aplicada</p>
                  <p className="text-sm font-semibold text-foreground">Verde Esmeralda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Como Funciona</h2>
            <p className="text-muted-foreground text-lg">Três passos simples para transformar qualquer ambiente</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: "Upload da Foto", desc: "Envie uma foto do ambiente que deseja simular" },
              { icon: Palette, title: "Escolha da Cor", desc: "Selecione cores do catálogo da sua loja" },
              { icon: Eye, title: "Visualização Instantânea", desc: "Veja o resultado com IA em tempo real" },
            ].map((step, i) => (
              <div
                key={i}
                className="text-center p-8 rounded-2xl bg-background border border-border hover:shadow-elevated transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                  {i + 1}
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Funcionalidades</h2>
            <p className="text-muted-foreground text-lg">Tudo que sua loja precisa para encantar clientes</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Palette, title: "Catálogos Personalizados", desc: "Crie catálogos com suas cores e marcas de tinta favoritas" },
              { icon: Sparkles, title: "IA Realista", desc: "Aplicação de cores com inteligência artificial para resultado natural" },
              { icon: Monitor, title: "White-label", desc: "Link personalizado com o branding da sua loja" },
              { icon: Layers, title: "Múltiplas Simulações", desc: "Compare várias cores no mesmo ambiente simultaneamente" },
              { icon: Upload, title: "Importar/Exportar CSV", desc: "Gerencie tintas em massa via planilha" },
              { icon: Eye, title: "Antes/Depois", desc: "Slider de comparação para impressionar o cliente" },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-soft transition-all duration-300"
              >
                <feat.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-base font-display font-semibold text-foreground mb-1.5">{feat.title}</h3>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Plano Único</h2>
            <p className="text-muted-foreground">Sem surpresas. Tudo incluso.</p>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-background p-8 shadow-glow">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-primary mb-1">Profissional</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-display font-bold text-foreground">R$ 59,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Simulador com IA ilimitado",
                "Catálogos personalizados",
                "White-label com sua marca",
                "Importação/Exportação CSV",
                "Geração de PDF",
                "Suporte prioritário",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="w-full" size="lg" asChild>
              <Link to="/login">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Palette className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Colora</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Colora. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;