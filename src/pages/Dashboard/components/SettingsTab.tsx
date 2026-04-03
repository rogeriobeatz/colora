import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  User, 
  Building2, 
  Link as LinkIcon, 
  Shield, 
  Check, 
  Globe, 
  Phone, 
  MapPin,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTabProps {
  company: any;
  user: any;
  updateCompanyLocal: (data: any) => void;
  handleSaveSettings: () => void;
  isSaving: boolean;
}

const SettingsSection = ({ icon: Icon, title, description, children }: any) => (
  <section className="space-y-6">
    <div className="flex items-center gap-3 px-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 text-foreground/60 border border-border/40">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{description}</p>
      </div>
    </div>
    <div className="bg-white border border-border/50 rounded-2xl p-8 shadow-sm space-y-8">
      {children}
    </div>
  </section>
);

export const SettingsTab = ({
  company,
  user,
  updateCompanyLocal,
  handleSaveSettings,
  isSaving
}: SettingsTabProps) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* ── HEADER UNIVERSAL ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Settings className="w-3.5 h-3.5" /> Back-office
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
            Gerencie as informações administrativas e técnicas da sua conta.
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="h-11 px-8 rounded-xl font-bold text-sm shadow-sm"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Dados Pessoais do Gestor */}
          <SettingsSection 
            icon={User} 
            title="Perfil do Gestor" 
            description="Informações de acesso à plataforma"
          >
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail de Acesso</Label>
                <Input value={user?.email || ""} disabled className="h-11 rounded-xl bg-slate-50 cursor-not-allowed border-border/40" />
                <p className="text-[9px] text-muted-foreground font-medium px-1 italic">O e-mail não pode ser alterado por aqui.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</Label>
                <Button variant="outline" className="w-full h-11 justify-start gap-3 rounded-xl font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 opacity-40" /> Alterar Senha de Acesso
                </Button>
              </div>
            </div>
          </SettingsSection>

          {/* Dados Comerciais */}
          <SettingsSection 
            icon={Building2} 
            title="Dados Comerciais" 
            description="Informações para faturamento e suporte"
          >
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Fantasia / Vitrine</Label>
                <Input 
                  value={company?.name || ""} 
                  onChange={(e) => updateCompanyLocal({ name: e.target.value })}
                  className="h-11 rounded-xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">CNPJ ou CPF</Label>
                <Input 
                  value={company?.documentNumber || ""} 
                  onChange={(e) => updateCompanyLocal({ documentNumber: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="h-11 rounded-xl" 
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Endereço Comercial</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    value={company?.address || ""} 
                    onChange={(e) => updateCompanyLocal({ address: e.target.value })}
                    className="h-11 pl-12 rounded-xl" 
                  />
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Canais de Contato */}
          <SettingsSection 
            icon={Globe} 
            title="Canais & Links" 
            description="Presença digital da sua vitrine"
          >
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">URL Pública (Slug)</Label>
                <div className="flex gap-2">
                  <div className="h-11 flex items-center px-4 bg-slate-50 border border-border/40 rounded-xl text-[10px] font-bold text-muted-foreground">/loja/</div>
                  <Input 
                    value={company?.slug || ""} 
                    onChange={(e) => updateCompanyLocal({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    className="h-11 rounded-xl font-mono text-xs" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp de Vendas</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    value={company?.phone || ""} 
                    onChange={(e) => updateCompanyLocal({ phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="h-11 pl-12 rounded-xl" 
                  />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Site Institucional</Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input 
                    value={company?.website || ""} 
                    onChange={(e) => updateCompanyLocal({ website: e.target.value })}
                    placeholder="https://www.sualoja.com.br"
                    className="h-11 pl-12 rounded-xl" 
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* COLUNA LATERAL (AUXILIAR) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-primary/60" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Privacidade</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Suas informações são armazenadas de forma segura e criptografada. Os dados comerciais são usados apenas para fins de suporte e faturamento.
            </p>
            <div className="pt-2">
              <Button variant="link" className="p-0 h-auto text-[10px] font-bold uppercase tracking-widest text-primary">Política de Dados</Button>
            </div>
          </div>

          <div className="p-6 border border-dashed border-border/60 rounded-2xl text-center space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plano Ativo</p>
            <p className="text-sm font-bold text-foreground">Colora Professional Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
};
