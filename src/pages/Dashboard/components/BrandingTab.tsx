import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, 
  X, 
  Check, 
  ImageIcon, 
  Palette, 
  Type, 
  Layout, 
  Sparkles,
  Fingerprint,
  Monitor,
  AppWindow,
  Zap,
  Leaf
} from "lucide-react";
import { HeaderStyleMode, FontSet } from "@/data/defaultColors";
import { cn } from "@/lib/utils";

interface BrandingTabProps {
  company: any;
  isSaving: boolean;
  logoGuidelinesOpen: boolean;
  pendingLogoFile: File | null;
  logoInputRef: React.RefObject<HTMLInputElement>;
  handleSaveBranding: () => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateCompanyLocal: (data: any) => void;
  setLogoGuidelinesOpen: (open: boolean) => void;
  setPendingLogoFile: (file: File | null) => void;
  uploadLogo: (file: File) => void;
}

export const BrandingTab = ({
  company,
  isSaving,
  logoGuidelinesOpen,
  pendingLogoFile,
  logoInputRef,
  handleSaveBranding,
  handleLogoUpload,
  updateCompanyLocal,
  setLogoGuidelinesOpen,
  setPendingLogoFile,
  uploadLogo
}: BrandingTabProps) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* ── HEADER MASTER SUTIL ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary/70 font-bold uppercase tracking-[0.2em] text-[10px]">
            <Fingerprint className="w-3.5 h-3.5" /> Identidade Master
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Aparência da Plataforma</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Personalize a estética do seu SaaS white-label em poucos cliques.
          </p>
        </div>
        <Button 
          onClick={handleSaveBranding} 
          disabled={isSaving} 
          className="h-11 px-8 rounded-xl font-bold text-sm shadow-sm"
        >
          {isSaving ? "Publicando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: CORES & LOGO */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Paleta de Cores Master */}
          <section className="bg-white border border-border/50 rounded-2xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/40">
                <Palette className="w-4 h-4 text-foreground/60" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">DNA de Cores</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { label: "Cor Principal", key: "primaryColor" as const, value: company?.primaryColor || "#3b82f6", desc: "DNA visual e botões." },
                { label: "Cor de Suporte", key: "secondaryColor" as const, value: company?.secondaryColor || "#1d4ed8", desc: "Gradientes e detalhes." }
              ].map(({ label, key, value, desc }) => (
                <div key={key} className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</Label>
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-border/40 transition-all hover:border-primary/20">
                    <div className="relative w-12 h-12 shrink-0">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full h-full rounded-lg border-2 border-white shadow-md transition-transform group-hover:scale-105" style={{ backgroundColor: value }} />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={value}
                        onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                        className="h-9 font-mono text-xs uppercase bg-white border-border/60"
                      />
                      <p className="text-[9px] text-muted-foreground mt-1.5 font-medium">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Logotipo Master */}
          <section className="bg-white border border-border/50 rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/40">
                  <ImageIcon className="w-4 h-4 text-foreground/60" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Ativos de Marca</h3>
              </div>
              <button className="text-[10px] font-bold text-primary/70 hover:text-primary" onClick={() => setLogoGuidelinesOpen(true)}>Diretrizes</button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
              <div 
                className="w-full sm:w-48 h-32 border-2 border-dashed border-border/60 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden group"
                onClick={() => logoInputRef.current?.click()}
              >
                <input type="file" ref={logoInputRef} className="hidden" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} />
                {company?.logo ? (
                  <img src={company.logo} alt="Logo" className="max-h-20 w-auto object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-sm font-bold text-foreground">Selo da Vitrine</p>
                <p className="text-xs text-muted-foreground leading-relaxed">PNG ou SVG transparente. Recomendado 400px.</p>
                {company?.logo && (
                  <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2 hover:underline" onClick={() => updateCompanyLocal({ logo: undefined })}>Remover</button>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: ESTRUTURA */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Interface Master */}
          <section className="bg-white border border-border/50 rounded-2xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/40">
                <AppWindow className="w-4 h-4 text-foreground/60" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Interface</h3>
            </div>

            {/* Tipografia Simplificada */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Estilo de Componentes</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "grotesk", label: "Técnico" },
                  { value: "rounded", label: "Orgânico" },
                  { value: "neo", label: "Industrial" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCompanyLocal({ fontSet: opt.value as FontSet })}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-bold transition-all",
                      company?.fontSet === opt.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-white border-border/60 hover:border-primary/20"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* A OPÇÃO MESTRE: 2 ESTILOS APENAS */}
            <div className="space-y-4 pt-6 border-t border-border/40">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Arquitetura de Navegação</Label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { 
                    value: "glass", 
                    label: "Minimalista (Claro)", 
                    desc: "Interface leve e sóbria. Fundo branco puro com detalhes discretos.",
                    icon: <Leaf className="w-4 h-4" />
                  },
                  { 
                    value: "gradient", 
                    label: "Vibrante (Colorido)", 
                    desc: "Destaque total para sua marca. Sidebar e Header assumem as cores do DNA.",
                    icon: <Zap className="w-4 h-4" />
                  }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCompanyLocal({ headerStyle: opt.value as HeaderStyleMode })}
                    className={cn(
                      "p-5 rounded-2xl border-2 text-left transition-all group flex items-start gap-4",
                      company?.headerStyle === opt.value || (opt.value === 'glass' && company?.headerStyle === 'card') || (opt.value === 'gradient' && company?.headerStyle === 'primary')
                        ? "border-primary bg-primary/5 shadow-md"
                        : "bg-white border-transparent hover:border-border/60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      company?.headerStyle === opt.value || (opt.value === 'glass' && company?.headerStyle === 'card') || (opt.value === 'gradient' && company?.headerStyle === 'primary')
                        ? "bg-primary text-primary-foreground" 
                        : "bg-slate-100 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {opt.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{opt.label}</div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={logoGuidelinesOpen} onOpenChange={setLogoGuidelinesOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Diretrizes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              "Arquivos .SVG garantem nitidez máxima.",
              "PNG transparente evita caixas brancas.",
              "Centralize o logo com margem de segurança."
            ].map((text, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl font-bold h-10 text-xs" onClick={() => setLogoGuidelinesOpen(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
