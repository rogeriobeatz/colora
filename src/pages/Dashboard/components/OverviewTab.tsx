import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, FolderOpen, Layers, Palette, Sparkles, Clock, Play, Trash2, Loader2 } from "lucide-react";
import { ProjectListItem } from "@/components/simulator/ProjectDrawer";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";

interface OverviewTabProps {
  company: any;
  sessions: ProjectListItem[];
  sessionsLoading: boolean;
  handleOpenProject: (id: string) => void;
  handleNewProject: () => void;
  handleDeleteSession: (id: string) => void;
}

export const OverviewTab = ({
  company,
  sessions,
  sessionsLoading,
  handleOpenProject,
  handleNewProject,
  handleDeleteSession
}: OverviewTabProps) => {
  const accessibleStyles = useAccessibleStyles();

  // Funções auxiliares
  const getTokenStatus = () => {
    if (!company) return { status: 'loading', color: 'gray', text: 'Carregando...' };

    if (company.tokens <= 0) {
      return { status: 'empty', color: 'red', text: 'Sem tokens' };
    }

    if (company.tokensExpiresAt) {
      const expiryDate = new Date(company.tokensExpiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 7) {
        return { status: 'expiring', color: 'orange', text: `Expira em ${daysLeft} dias` };
      }
    }

    return { status: 'available', color: 'green', text: 'Disponíveis' };
  };

  const formatTokenAmount = (amount: number) => {
    return amount.toLocaleString('pt-BR');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const totalPaints = company?.catalogs?.reduce((s: number, c: any) => s + c.paints.length, 0) || 0;
  const activeCatalogs = company?.catalogs?.filter((c: any) => c.active).length || 0;
  const tokenStatus = getTokenStatus();

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Tokens",
            value: formatTokenAmount(company?.tokens || 0),
            icon: Coins,
            color: tokenStatus.color,
            sub: tokenStatus.text
          },
          {
            label: "Projetos Salvos",
            value: sessionsLoading ? "..." : sessions.length,
            icon: FolderOpen,
            color: accessibleStyles.primary.primaryIcon.color,
            sub: "no seu dispositivo"
          },
          {
            label: "Catálogos Ativos",
            value: activeCatalogs,
            icon: Layers,
            color: accessibleStyles.secondary.secondaryIcon.color,
            sub: `de ${company?.catalogs?.length || 0} total`
          },
          {
            label: "Total de Cores",
            value: totalPaints,
            icon: Palette,
            color: "#6366f1",
            sub: "em todos os catálogos"
          }
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Botão Principal - Acesso Rápido ao Simulador */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-border p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" /> Ferramenta Principal
            </h3>
            <p className="text-sm text-muted-foreground">
              Acesse o simulador de pinturas para criar projetos incríveis
            </p>
          </div>
          <Button
            size="lg"
            asChild
            className="gap-2 h-12 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            style={accessibleStyles.elements.actionButton}
          >
            <Link to="/simulator" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Abrir Simulador
            </Link>
          </Button>
        </div>
      </div>

      {/* Sessões recentes */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Projetos Recentes
          </h3>
          <Button size="sm" variant="outline" onClick={handleNewProject} className="gap-1.5">
            <Play className="w-3.5 h-3.5" /> Novo
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
            <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum projeto salvo ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Inicie uma simulação e ela será salva automaticamente</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
              >
                <button className="flex-1 text-left min-w-0" onClick={() => handleOpenProject(s.id)}>
                  <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(s.updatedAt)}</span>
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProject(s.id)} title="Abrir">
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteSession(s.id)} title="Excluir">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
