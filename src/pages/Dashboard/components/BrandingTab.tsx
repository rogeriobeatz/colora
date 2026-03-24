import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Check, MapPin, Globe, Phone, Settings, ImageIcon, Palette } from "lucide-react";
import { HeaderContentMode, HeaderStyleMode, FontSet } from "@/data/defaultColors";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";

interface BrandingTabProps {
  company: any;
  isSaving: boolean;
  logoGuidelinesOpen: boolean;
  pendingLogoFile: File | null;
  logoInputRef: React.RefObject<HTMLInputElement>;
  
  // Handlers
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
  const accessibleStyles = useAccessibleStyles();

  return (
    <div className="grid md:grid-cols-[1fr_340px] gap-8">
      {/* Formulário */}
      <div className="bg-card rounded-2xl border border-border p-8 shadow-soft space-y-8">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-1">Identidade da Marca</h2>
          <p className="text-sm text-muted-foreground">Personalize como sua loja aparece para os clientes.</p>
        </div>

        <div className="space-y-6">
          {/* Nome + Slug */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome da Loja</Label>
              <Input 
                value={company?.name || ""} 
                onChange={(e) => updateCompanyLocal({ name: e.target.value })} 
                className="h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Slug (URL)</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground shrink-0">
                  /empresa/
                </div>
                <Input
                  value={company?.slug || ""}
                  onChange={(e) => updateCompanyLocal({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  className="h-11 font-mono text-sm"
                  placeholder="minha-loja"
                />
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Cor Primária",
                key: "primaryColor" as const,
                value: company?.primaryColor || "#1a8a6a",
                desc: "Usada em botões, links e destaque"
              },
              {
                label: "Cor Secundária",
                key: "secondaryColor" as const,
                value: company?.secondaryColor || "#e87040",
                desc: "Usada em detalhes e gradientes"
              }
            ].map(({ label, key, value, desc }) => (
              <div key={key} className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
                <div className="flex gap-2">
                  <div className="relative w-11 h-11 shrink-0">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full h-full rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: value }} />
                  </div>
                  <Input
                    value={value}
                    onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                    className="h-11 font-mono text-sm uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logotipo</Label>
            <input 
              type="file" 
              ref={logoInputRef} 
              className="hidden" 
              accept="image/png,image/jpeg,image/svg+xml" 
              onChange={handleLogoUpload} 
            />
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/40 transition-colors cursor-pointer group"
              onClick={() => logoInputRef.current?.click()}
            >
              {company?.logo ? (
                <div className="relative h-20 mx-auto" style={{ width: "auto", maxWidth: "200px" }}>
                  <img src={company.logo} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Clique para fazer upload (PNG, SVG, JPG · máx 2MB)</p>
                </>
              )}
            </div>
            {company?.logo && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive w-full" 
                onClick={() => updateCompanyLocal({ logo: undefined })}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Remover logo
              </Button>
            )}
          </div>

          {/* Dados da Empresa */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Dados de Contato
            </h3>
            <p className="text-xs text-muted-foreground">Esses dados aparecem no rodapé do simulador público.</p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={company?.phone || ""}
                    onChange={(e) => updateCompanyLocal({ phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={company?.website || ""}
                    onChange={(e) => updateCompanyLocal({ website: e.target.value })}
                    placeholder="www.sualoja.com.br"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço</Label>
              <Input
                value={company?.address || ""}
                onChange={(e) => updateCompanyLocal({ address: e.target.value })}
                placeholder="Rua Example, 123 - Cidade/UF"
                className="h-11"
              />
            </div>
          </div>

          {/* Estilo do Cabeçalho */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" /> Estilo do Cabeçalho
            </h3>
            
            {/* Modelo do cabeçalho */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estilo da Barra Superior</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "glass", label: "Vidro", desc: "Translúcido moderno" },
                  { value: "gradient", label: "Gradiente", desc: "Degrade vibrante" },
                  { value: "card", label: "Cartão", desc: "Elegante com linha" },
                  { value: "primary", label: "Sólido", desc: "Cor primária limpa" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCompanyLocal({ headerStyle: opt.value as HeaderStyleMode })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      company?.headerStyle === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="font-medium text-sm text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo do cabeçalho */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conteúdo do Cabeçalho</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "logo+name", label: "Logo + Nome", icon: "🔤" },
                  { value: "logo", label: "Só Logo", icon: "🖼️" },
                  { value: "name", label: "Só Nome", icon: "📝" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCompanyLocal({ headerContent: opt.value as HeaderContentMode })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      company?.headerContent === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <p className="text-xs font-bold text-foreground mt-1">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSaveBranding} disabled={isSaving} className="w-full h-11" style={accessibleStyles.elements.actionButton}>
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prévia ao Vivo</h3>

        {/* Simulador mock */}
        <div className="bg-background rounded-2xl border border-border shadow-elevated overflow-hidden">
          {/* Header preview */}
          <div
            className={`h-12 flex items-center gap-2 px-3 ${
              company?.headerStyle === "glass" ? "bg-background/80 backdrop-blur-lg" :
              company?.headerStyle === "gradient" ? "border-b border-transparent" :
              company?.headerStyle === "card" ? "bg-card border-b border-border shadow-lg" :
              "bg-background/80 backdrop-blur-lg"
            }`}
            style={
              company?.headerStyle === "gradient" ? {
                background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)`
              } : company?.headerStyle === "primary" ? {
                backgroundColor: company.primaryColor,
                opacity: 0.95
              } : undefined
            }
          >
            {/* Linha gradient para o estilo cartão */}
            {company?.headerStyle === "card" && (
              <div
                className="h-1 w-full"
                style={{
                  background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})`
                }}
              />
            )}

            {(company?.headerContent === "logo+name" || company?.headerContent === "logo") && (
              <div
                className="h-6 rounded flex items-center justify-center"
                style={{
                  backgroundColor: company?.logo ? "transparent" : 
                    (company?.headerStyle === "gradient" || company?.headerStyle === "primary") ? "rgba(255,255,255,0.15)" : undefined,
                  width: company?.logo ? "auto" : "1.5rem",
                  maxWidth: "80px",
                  border: (company?.headerStyle === "gradient" || company?.headerStyle === "primary") ? "1px solid rgba(255,255,255,0.2)" : undefined,
                  opacity: company?.headerStyle === "primary" ? 0.9 : undefined
                }}
              >
                {company?.logo ? (
                  <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Palette className="w-3 h-3" style={{ 
                    color: (company?.headerStyle === "gradient" || company?.headerStyle === "primary") ? "#FFFFFF" : company.primaryColor 
                  }} />
                )}
              </div>
            )}
            {(company?.headerContent === "logo+name" || company?.headerContent === "name") && (
              <span className={`text-sm font-bold ${
                (company?.headerStyle === "gradient" || company?.headerStyle === "primary") ? "" : "text-foreground"
              }`} style={
                (company?.headerStyle === "gradient" || company?.headerStyle === "primary") ? {
                  color: '#FFFFFF'
                } : undefined
              }>
                {company?.name}
              </span>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
              <ImageIcon className="w-6 h-6 opacity-20" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {company?.catalogs?.[0]?.paints?.slice(0, 8).map((p: any) => (
                <div key={p.id} title={p.name} className="aspect-square rounded-md border border-border" style={{ backgroundColor: p.hex }} />
              ))}
            </div>
            <div className="h-8 rounded-lg w-full" style={{ backgroundColor: company?.primaryColor }} />
          </div>
        </div>

        {/* Link público */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-soft space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/empresa/${company?.slug || "–"}` : `/empresa/${company?.slug || "–"}`}
            </div>
          </div>
        </div>
      </div>

      {/* Logo Guidelines Dialog */}
      <Dialog open={logoGuidelinesOpen} onOpenChange={setLogoGuidelinesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Diretrizes de Logo</DialogTitle>
            <DialogDescription>
              Para garantir a melhor aparência do seu logo na plataforma, siga estas diretrizes:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Formato PNG ou SVG</p>
                  <p className="text-sm text-muted-foreground">Use vetoriais (SVG) ou PNG com fundo transparente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Resolução mínima de 200x200px</p>
                  <p className="text-sm text-muted-foreground">Maior resolução garante melhor qualidade</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Design simples e limpo</p>
                  <p className="text-sm text-muted-foreground">Logos muito detalhados podem não ficar bem em pequenos tamanhos</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoGuidelinesOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (pendingLogoFile) {
                uploadLogo(pendingLogoFile);
                setPendingLogoFile(null);
              }
              setLogoGuidelinesOpen(false);
            }}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
