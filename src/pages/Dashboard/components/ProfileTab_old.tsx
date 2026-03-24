import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Building2, CreditCard, FileText, RefreshCw, Globe, Loader2 } from "lucide-react";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";

interface ProfileTabProps {
  user: any;
  company: any;
  displayData: any;
  tokenHistory: any[];
  tokenHistoryLoading: boolean;
  isCheckoutLoading: boolean;
  
  // Token management
  getTokenStatus: () => any;
  formatTokenAmount: (amount: number) => string;
  handleCheckout: (mode: "subscription" | "recharge") => void;
  handleManageSubscription: () => void;
  checkSubscription: () => Promise<any>;
  refreshData: () => Promise<void>;
}

export const ProfileTab = ({
  user,
  company,
  displayData,
  tokenHistory,
  tokenHistoryLoading,
  isCheckoutLoading,
  
  getTokenStatus,
  formatTokenAmount,
  handleCheckout,
  handleManageSubscription,
  checkSubscription,
  refreshData
}: ProfileTabProps) => {
  const accessibleStyles = useAccessibleStyles();
  const tokenStatus = getTokenStatus();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="grid md:grid-cols-[1fr_340px] gap-8">
      {/* Dados Pessoais */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados Pessoais
          </h3>
          
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Nome Completo</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.name}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">E-mail</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.email}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Telefone</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.phone}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Tipo de Documento</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground capitalize">
                {displayData.documentType.toUpperCase()}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Documento</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.documentNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados da Empresa
          </h3>
          
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Nome da Loja</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.companyName}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Website</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.website ? (
                  <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {displayData.website}
                  </a>
                ) : (
                  "Não informado"
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Endereço</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                {displayData.address}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Status da Assinatura */}
      <div className="space-y-6">
        {/* Status da Assinatura */}
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Assinatura
          </h3>
          
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Status</Label>
              <div className="mt-2">
                <Badge
                  variant={company?.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                  className="w-full justify-center py-2"
                  style={company?.subscriptionStatus === 'active' ? accessibleStyles.primary.primaryBadge : accessibleStyles.elements.inactiveStatus}
                >
                  {company?.subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-foreground">Tokens Disponíveis</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {formatTokenAmount(company?.tokens || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tokenStatus.text}
                </div>
              </div>
            </div>
            
            {company?.tokensExpiresAt && (
              <div>
                <Label className="text-sm font-medium text-foreground">Validade dos Tokens</Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                  {new Date(company.tokensExpiresAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
            
            <div className="pt-2 space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={async () => {
                  await checkSubscription();
                  await refreshData();
                  // toast.success("Status atualizado!");
                }}
                style={accessibleStyles.elements.secondaryActionButton}
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar Status
              </Button>
              
              {company?.subscriptionStatus !== 'active' && (
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.location.href = '/checkout'}
                  style={accessibleStyles.elements.actionButton}
                >
                  <CreditCard className="w-4 h-4" />
                  Assinar Agora
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Histórico de Tokens */}
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Tokens
          </h3>
          
          <div className="bg-card border border-border rounded-xl p-6">
            {tokenHistoryLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : tokenHistory.length > 0 ? (
              <div className="space-y-3">
                {tokenHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {item.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                    <Badge 
                      variant={item.amount > 0 ? 'default' : 'destructive'} 
                      style={item.amount > 0 ? accessibleStyles.primary.primaryBadge : undefined}
                    >
                      {item.amount > 0 ? '+' : ''}{item.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma movimentação de tokens</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
