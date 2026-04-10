import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Leaf,
  Info
} from "lucide-react";
import { HeaderStyleMode, FontSet } from "@/data/defaultColors";
import { cn } from "@/lib/utils";
import { useContrastColor } from "@/hooks/useContrastColor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const primaryContrast = useContrastColor(company?.primaryColor || "#3b82f6");
  const isPrimaryLight = primaryContrast === "text-black";

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* ── HEADER MASTER SUTIL ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary/70 font-bold uppercase tracking-[0.2em] text-[10px]">
            <Fingerprint className="w-3.5 h-3.5" /> Identidade Master
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Aparência da Plataforma</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Personalize a estética do seu SaaS em poucos cliques.
          </p>
        </div>
        <Button 
          onClick={handleSaveBranding} 
          disabled={isSaving} 
          className="rounded-xl px-8 h-11 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5" /> Salvar Configurações
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ── COLUNA DE EDIÇÃO ──────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. SEÇÃO DE CORES */}
          <section className="bg-white rounded-3xl p-8 border border-border/50 shadow-sm space-y-8">
            <div className="flex items-center gap-3 text-foreground mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">DNA de Cores</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { label: "Cor Principal", key: "primaryColor" as const, value: company?.primaryColor || "#3b82f6", desc: "DNA visual e botões.", showContrast: true },
                { label: "Cor de Suporte", key: "secondaryColor" as const, value: company?.secondaryColor || "#1d4ed8", desc: "Gradientes e detalhes." }
              ].map(({ label, key, value, desc, showContrast }) => (
                <div key={key} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</Label>
                    {showContrast && (
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 border-transparent flex items-center gap-1", isPrimaryLight ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                        <Info className="w-2.5 h-2.5" />
                        {isPrimaryLight ? "Botões com texto Preto (WCAG)" : "Botões com texto Branco (WCAG)"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-border/40 transition-all hover:border-primary/20">
                    <div className="relative w-12 h-12 shrink-0">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full h-full rounded-lg border-2 border-white shadow-md transition-transform group-hover:scale-105 flex items-center justify-center" style={{ backgroundColor: value }}>
                         {showContrast && <span className={cn("text-[10px] font-bold", isPrimaryLight ? "text-black" : "text-white")}>Aa</span>}
                      </div>
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

          {/* 2. LOGOTIPO */}
          <section className="bg-white rounded-3xl p-8 border border-border/50 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Identidade Visual</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLogoGuidelinesOpen(true)} className="text-[9px] font-bold uppercase tracking-widest h-7">Guia de Uso</Button>
            </div>

            <div className="relative group border-2 border-dashed border-border/60 rounded-2xl p-8 transition-all hover:border-primary/30 hover:bg-slate-50/50 flex flex-col items-center justify-center gap-4 overflow-hidden">
              {company?.logo ? (
                <>
                  <img src={company.logo} alt="Logo" className="max-h-20 max-w-[200px] object-contain drop-shadow-sm transition-transform group-hover:scale-105" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest gap-2 bg-white">Trocar Logo</Button>
                    <Button variant="ghost" size="sm" onClick={() => updateCompanyLocal({ logo: null })} className="h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50">Remover</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-foreground">Arraste seu logo aqui</p>
                    <p className="text-[10px] text-muted-foreground">SVG ou PNG fundo transparente (Max 2MB)</p>
                  </div>
                  <Button size="sm" onClick={() => logoInputRef.current?.click()} className="mt-2 h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest px-6">Escolher Arquivo</Button>
                </>
              )}
              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            </div>
          </section>

          {/* 3. TIPOGRAFIA & GEOMETRIA */}
          <section className="bg-white rounded-3xl p-8 border border-border/50 shadow-sm space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layout className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Estilo & Forma</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* BLOCO DE FONTE (TOTALMENTE ISOLADO) */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                    <Type className="w-3 h-3 text-primary" /> Personalidade da Fonte
                  </Label>
                  <p className="text-[10px] text-muted-foreground font-medium">Define o tom da voz da sua marca.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'grotesk' as const, label: 'Outfit (Técnica)', desc: 'Moderna e Legível' },
                    { id: 'technical' as const, label: 'Helvetica (Sóbria)', desc: 'Clássica e Funcional' },
                    { id: 'rounded' as const, label: 'Jost (Geométrica)', desc: 'Amigável e Aberta' },
                    { id: 'neo' as const, label: 'Inter (Industrial)', desc: 'Industrial e Direta' }
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => updateCompanyLocal({ fontSet: font.id })}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group text-left",
                        company?.fontSet === font.id ? "border-primary bg-primary/[0.03]" : "border-slate-50 hover:border-slate-200 bg-slate-50/30"
                      )}
                    >
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", company?.fontSet === font.id ? "text-primary" : "text-slate-600")}>{font.label}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-tight font-medium">{font.desc}</p>
                      </div>
                      <Check className={cn("w-4 h-4 text-primary transition-all", company?.fontSet === font.id ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* BLOCO DE MODELO DE DASHBOARD (REINTRODUZIDO) */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                    <Layout className="w-3 h-3 text-primary" /> Modelo do Dashboard
                  </Label>
                  <p className="text-[10px] text-muted-foreground font-medium">Escolha o estilo visual do topo.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'white', label: 'Simples', desc: 'Fundo branco limpo' },
                    { id: 'gradient', label: 'Degradê', desc: 'Cores vibrantes' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateCompanyLocal({ headerStyle: style.id as HeaderStyleMode })}
                      className={cn(
                        "flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left",
                        company?.headerStyle === style.id ? "border-primary bg-primary/[0.03]" : "border-slate-50 hover:border-slate-200 bg-slate-50/30"
                      )}
                    >
                      <p className={cn("text-xs font-bold", company?.headerStyle === style.id ? "text-primary" : "text-slate-600")}>{style.label}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-tight font-medium leading-tight">{style.desc}</p>
                      <Check className={cn("w-3.5 h-3.5 text-primary mt-1 transition-all", company?.headerStyle === style.id ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. BLOCO DE CANTOS (MOVIDO PARA SEÇÃO PRÓPRIA PARA MELHOR ORGANIZAÇÃO) */}
          <section className="bg-white rounded-3xl p-8 border border-border/50 shadow-sm space-y-6">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                  <AppWindow className="w-3 h-3 text-primary" /> Acabamento de Cantos
                </Label>
                <p className="text-[10px] text-muted-foreground font-medium">Define a geometria de botões, cards e cabeçalho.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'square', label: 'Retos', radius: '0px' },
                  { id: 'soft', label: 'Suaves', radius: '8px' },
                  { id: 'rounded', label: 'Arredondados', radius: '24px' }
                ].map((radius) => (
                  <button
                    key={radius.id}
                    onClick={() => updateCompanyLocal({ border_radius: radius.id })}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      company?.border_radius === radius.id ? "border-primary bg-primary/[0.03]" : "border-slate-50 hover:border-slate-200 bg-slate-50/30"
                    )}
                  >
                    <div className="w-full aspect-video border-2 border-slate-300 bg-white shadow-sm flex items-center justify-center overflow-hidden" style={{ borderRadius: radius.radius }}>
                       <div className="w-2/3 h-1/2 bg-slate-100 rounded-[inherit] border border-slate-200" />
                    </div>
                    <p className={cn("text-[9px] font-black uppercase tracking-widest", company?.border_radius === radius.id ? "text-primary" : "text-slate-400")}>{radius.label}</p>
                  </button>
                ))}
              </div>
          </section>
        </div>

        {/* ── COLUNA DE PREVIEW ─────────────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase tracking-widest text-[9px] ml-4">
              <Monitor className="w-3 h-3" /> Preview em Tempo Real
            </div>
            
            <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-8 border-slate-800">
              <div className="bg-white rounded-[1.8rem] overflow-hidden aspect-[9/16] relative flex flex-col">
                
                {/* Header Mockup */}
                <div className="h-14 border-b border-border/40 flex items-center justify-between px-4" style={company?.headerStyle === 'gradient' ? { background: `linear-gradient(135deg, ${company?.primaryColor}, ${company?.secondaryColor})`, color: '#fff' } : {}}>
                  <div className="flex items-center gap-2">
                    {company?.logo ? <img src={company.logo} className="h-5 w-auto object-contain" /> : <div className="w-5 h-5 rounded bg-primary" />}
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">{company?.name || "Minha Loja"}</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-100" />
                </div>

                {/* Content Mockup */}
                <div className="flex-1 p-6 space-y-6 bg-slate-50/50">
                  <div className="space-y-2">
                    <div className="h-3 w-2/3 bg-slate-200 rounded-full" />
                    <div className="h-2 w-full bg-slate-100 rounded-full" />
                  </div>
                  
                  <div className="aspect-square bg-white rounded-2xl border border-border/40 shadow-sm flex items-center justify-center p-4">
                    <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                  </div>

                  <Button className="w-full h-10 shadow-lg font-black text-[10px] uppercase tracking-widest" style={{ backgroundColor: company?.primaryColor, color: isPrimaryLight ? '#000' : '#fff', borderRadius: company?.border_radius === 'rounded' ? '24px' : company?.border_radius === 'soft' ? '8px' : '0px' }}>
                    Preview do Botão
                  </Button>

                  <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-lg bg-slate-200" />)}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground font-medium px-8 leading-relaxed">
              O preview acima é uma representação aproximada de como a interface se comportará no smartphone do vendedor.
            </p>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={logoGuidelinesOpen} onOpenChange={setLogoGuidelinesOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Guia do Logotipo</DialogTitle>
            <DialogDescription className="text-xs">Para um visual premium, siga estas dicas:</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { t: "Fundo Transparente", d: "Use PNG ou SVG sem fundo branco." },
              { t: "Cores Contrastantes", d: "Garanta que o logo seja visível sobre branco." },
              { t: "Proporção", d: "Logos horizontais funcionam melhor no header." }
            ].map((g, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-primary" /></div>
                <div>
                  <p className="text-xs font-bold text-foreground">{g.t}</p>
                  <p className="text-[10px] text-muted-foreground">{g.d}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              className="w-full rounded-xl font-bold h-10 text-xs" 
              onClick={() => {
                if (pendingLogoFile) {
                  uploadLogo(pendingLogoFile);
                  setPendingLogoFile(null);
                }
                setLogoGuidelinesOpen(false);
              }}
            >
              Entendido, Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
