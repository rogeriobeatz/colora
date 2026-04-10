import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  FileText, 
  RefreshCw, 
  Loader2, 
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Check,
  User,
  Building2,
  ChevronRight,
  Info,
  Edit2,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  user: any;
  company: any;
  displayData: any;
  tokenHistory: any[];
  tokenHistoryLoading: boolean;
  isCheckoutLoading: boolean;
  isPortalLoading?: boolean;
  isEditingProfile: boolean;
  profileData: any;
  isSavingProfile: boolean;
  getTokenStatus: () => any;
  formatTokenAmount: (amount: number) => string;
  handleCheckout: (mode: "subscription" | "recharge") => void;
  handleManageSubscription: () => void;
  checkSubscription: () => Promise<any>;
  refreshData: () => Promise<void>;
  handleEditProfile: () => void;
  handleSaveProfile: () => void;
  handleCancelEditProfile: () => void;
  setProfileData: (data: any) => void;
}

const InfoField = ({ label, value, icon: Icon }: any) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</Label>
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-border/40 text-sm font-medium text-foreground transition-all hover:bg-slate-100">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground/60" />}
      <span className="truncate">{value || "Não informado"}</span>
    </div>
  </div>
);

export const ProfileTab = ({
  company,
  tokenHistory,
  tokenHistoryLoading,
  isCheckoutLoading,
  isPortalLoading,
  isEditingProfile,
  profileData,
  isSavingProfile,
  getTokenStatus,
  formatTokenAmount,
  handleCheckout,
  handleManageSubscription,
  checkSubscription,
  refreshData,
  displayData,
  handleEditProfile,
  handleSaveProfile,
  handleCancelEditProfile,
  setProfileData
}: ProfileTabProps) => {
  const tokenStatus = getTokenStatus();
  
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const isActive = company?.subscriptionStatus === 'active';

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* ── HEADER UNIVERSAL ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" /> Economia & Plano
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tokens & Faturamento</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
            Gerencie sua assinatura, monitore o consumo de IA e adquira novos créditos.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            className="h-11 px-5 rounded-xl font-bold text-xs" 
            onClick={async () => { await checkSubscription(); await refreshData(); }}
           >
              <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
           </Button>
           <Button 
            onClick={handleManageSubscription} 
            disabled={isPortalLoading}
            className="h-11 px-6 rounded-xl font-bold text-sm shadow-sm"
           >
            {isPortalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Gerenciar Assinatura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA PRINCIPAL: PLANO & PERFIL */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Status do Plano Atual */}
          <section className="bg-white border border-border/50 rounded-2xl p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground text-primary">Plano Colora Pro</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sua assinatura ativa</p>
              </div>
              <Badge variant={isActive ? "default" : "secondary"} className="rounded-lg px-4 py-1 font-bold text-[10px] uppercase tracking-widest">
                {isActive ? "Pro Ativo" : "Pendente"}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Franquia Mensal</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">200</span>
                  <span className="text-xs font-medium text-muted-foreground">/tokens IA</span>
                </div>
                <p className="text-[10px] text-primary font-bold uppercase mt-4">R$ 59,90 <span className="text-muted-foreground">/mês</span></p>
              </div>
              
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Benefícios Master:
                  </p>
                  <ul className="space-y-2 pl-6">
                    {[
                      'Validade de 6 meses por token', 
                      'IA de segmentação ilimitada', 
                      'Suporte Prioritário 24/7', 
                      'Customização White-label'
                    ].map(item => (
                      <li key={item} className="text-[11px] text-muted-foreground font-medium list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Dados Cadastrais (Integrados na aba de Tokens para facilitar gestão) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-foreground">Identificação da Conta</h3>
              {!isEditingProfile && (
                <Button variant="ghost" size="sm" onClick={handleEditProfile} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-transparent">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                </Button>
              )}
            </div>

            <div className="bg-white border border-border/50 p-6 rounded-2xl shadow-sm">
              {isEditingProfile ? (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                      <Input value={profileData?.fullName || ""} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Comercial</Label>
                      <Input value={profileData?.phone || ""} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome da Empresa</Label>
                      <Input value={profileData?.companyName || ""} onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">CNPJ / CPF</Label>
                      <Input value={profileData?.documentNumber || ""} onChange={(e) => setProfileData({ ...profileData, documentNumber: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Website</Label>
                      <Input value={profileData?.website || ""} onChange={(e) => setProfileData({ ...profileData, website: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Endereço Completo</Label>
                      <Input value={profileData?.address || ""} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border/40">
                    <Button variant="ghost" onClick={handleCancelEditProfile} disabled={isSavingProfile} className="text-xs font-bold">Cancelar</Button>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="text-xs font-bold px-6">
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  <InfoField label="Nome de Acesso" value={displayData?.name} icon={User} />
                  <InfoField label="E-mail de Acesso" value={displayData?.email} icon={FileText} />
                  <InfoField label="WhatsApp" value={displayData?.phone} />
                  <InfoField label="Documento" value={displayData?.documentNumber} />
                </div>
              )}
            </div>
          </section>

          {/* Opções de Recarga Avulsa */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1 text-primary">
              <Zap className="w-4 h-4" />
              <h3 className="text-base font-bold text-foreground">Recarga Avulsa</h3>
            </div>
            
            <div className="bg-slate-50 border border-dashed border-border rounded-[2rem] p-10 text-center space-y-6 transition-all hover:bg-slate-100/50">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border/40">
                  <Zap className="w-8 h-8 text-primary" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-xl font-bold text-foreground tracking-tight">Precisa de mais créditos?</h4>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                    Adquira um pacote de recarga avulsa para continuar simulando sem interrupções.
                  </p>
               </div>
               <Button 
                onClick={() => handleCheckout("recharge")} 
                disabled={isCheckoutLoading}
                className="h-12 px-10 rounded-xl font-bold shadow-xl shadow-primary/20"
               >
                  {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Comprar Recarga
               </Button>
            </div>
          </section>
        </div>

        {/* SIDEBAR: SALDO & REGRAS */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Card de Saldo */}
          <div className="bg-white border border-border/50 rounded-2xl p-8 shadow-sm space-y-6 relative overflow-hidden group">
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saldo Disponível</p>
              <div className="text-5xl font-bold text-foreground tracking-tighter">
                {formatTokenAmount(company?.tokens || 0)}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-border/40 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span className="text-muted-foreground">Estado</span>
                <span className={cn(
                  tokenStatus.status === 'available' ? "text-green-600" : "text-amber-600"
                )}>{tokenStatus.text}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                <span className="text-muted-foreground">Renovação</span>
                <span className="text-foreground">Todo dia 01</span>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          </div>

          {/* Regras de Validade */}
          <div className="p-6 bg-slate-50/50 border border-border/40 rounded-2xl space-y-4">
             <div className="flex items-center gap-2 text-primary">
                <Info className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Validade</h4>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed font-medium italic">
                Tokens do plano Pro valem por **6 meses**. Tokens avulsos não expiram.
             </p>
          </div>

          {/* Atividades */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Últimos Consumos</h4>
            </div>
            
            <div className="space-y-2">
              {tokenHistoryLoading ? (
                <div className="flex justify-center py-10 opacity-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : tokenHistory.length > 0 ? (
                tokenHistory.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-border/40 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">{item.description}</p>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase">{formatDate(item.created_at)}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black",
                      item.amount > 0 ? "text-green-600" : "text-foreground/40"
                    )}>
                      {item.amount > 0 ? '+' : ''}{item.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-xl opacity-30 text-[9px] font-bold uppercase">Sem registros</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Import needed icons
import { Plus } from "lucide-react";
