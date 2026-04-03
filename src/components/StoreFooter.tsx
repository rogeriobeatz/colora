import { Company } from "@/data/defaultColors";
import { MapPin, Phone, Globe, Instagram, Facebook, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

function normalizeWebsite(url: string) {
  const v = (url || "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

const StoreFooter = ({ company }: { company: Company }) => {
  const phone = (company.phone || "").trim();
  const website = (company.website || "").trim();
  const address = (company.address || "").trim();

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Faixa Superior Colorida (Branding do Cliente) */}
      <div className="h-1.5 w-full" style={{ 
        background: `linear-gradient(to right, ${company.primaryColor}, ${company.secondaryColor || company.primaryColor})` 
      }} />

      <div className="bg-white border-t border-border/40 pt-16 pb-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* 1. BRANDING & SOBRE */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-4">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="h-10 w-auto object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <img src="/colora-icon.svg" alt="Colora" className="w-5 h-5 brightness-0 invert" />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-foreground">{company.name}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-xs">
                Sua vitrine digital de cores. Visualize, experimente e transforme seu ambiente com a tecnologia líder em simulação de tintas.
              </p>
              <div className="flex items-center gap-3">
                {[Instagram, Facebook, Youtube].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-full bg-slate-50 border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. CONTATO RÁPIDO */}
            <div className="lg:col-span-4 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Atendimento ao Cliente</h4>
              <div className="space-y-4">
                {phone && (
                  <div className="flex items-start gap-3 group cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-border/40 group-hover:border-primary/20 transition-colors">
                      <Phone className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone / WhatsApp</p>
                      <p className="text-sm font-bold text-foreground">{phone}</p>
                    </div>
                  </div>
                )}
                {website && (
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-border/40 group-hover:border-primary/20 transition-colors">
                      <Globe className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website Oficial</p>
                      <a href={normalizeWebsite(website)} target="_blank" rel="noreferrer" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                        {website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ENDEREÇO & HORÁRIO */}
            <div className="lg:col-span-4 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Nossa Localização</h4>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-border/40">
                  <MapPin className="w-4 h-4 text-primary/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground leading-snug">
                    {address || "Endereço comercial não informado"}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Consulte disponibilidade de entrega em sua região.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RODAPÉ INFERIOR: COPYRIGHT + POWERED BY */}
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                © {new Date().getFullYear()} {company.name} · CNPJ {company.documentNumber || "00.000.000/0000-00"}
              </p>
              <p className="text-[9px] text-muted-foreground/60 font-medium">
                Imagens meramente ilustrativas. As cores podem variar conforme a calibração do monitor.
              </p>
            </div>

            {/* ASSINATURA COLORA OFICIAL */}
            <div className="flex items-center gap-4 py-2 px-6 bg-slate-50 rounded-2xl border border-border/40 hover:bg-white transition-colors duration-500 group">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">Technology by</span>
              <div className="flex items-center gap-2">
                <img src="/colora-logo.svg" alt="Colora Logo" className="h-5 w-auto opacity-60 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
