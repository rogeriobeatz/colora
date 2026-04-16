import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  FolderOpen, 
  Layers, 
  Palette, 
  Clock, 
  Play, 
  Trash2, 
  LayoutGrid,
  TrendingUp,
  Plus,
  LayoutDashboard,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
  company: any;
  sessions: any[];
  sessionsLoading: boolean;
  handleOpenProject: (id: string) => void;
  handleNewProject: () => void;
  handleDeleteSession: (id: string) => void;
}

const StatCard = ({ label, value, sub, icon: Icon, trend, onClick }: any) => (
  <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 transition-all duration-normal hover:border-primary/20 shadow-sm hover:shadow-md animate-fade-in cursor-pointer"
       onClick={onClick}>
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-slate-50 text-foreground/60 border border-border/40 shadow-sm">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      {trend && (
        <span className="text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100 uppercase tracking-widest shadow-sm">
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-0.5">
      <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <h4 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{value}</h4>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground/60">{sub}</p>
    </div>
  </div>
);

const ProjectCard = ({ session, onOpen, onDelete, formatDate }: any) => {
  const firstRoom = session.rooms?.[0];
  const thumbnailUrl = firstRoom?.thumbnailUrl || firstRoom?.imageUrl || "/placeholder.svg";

  return (
    <div className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all duration-normal animate-fade-in cursor-pointer"
         onClick={() => onOpen(session.id)}>
      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={session.name} 
          className="w-full h-full object-cover transition-transform duration-normal group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-normal flex items-center justify-center gap-2">
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onOpen(session.id); }} className="h-8 px-4 rounded-lg font-bold text-xs mobile-touch-target">
            Abrir
          </Button>
          <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} className="h-8 w-8 rounded-lg bg-white/90 border-red-200 hover:bg-red-50 group mobile-touch-target">
            <Trash2 className="w-3.5 h-3.5 text-red-600 group-hover:text-red-700" />
          </Button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <h5 className="font-bold text-sm sm:text-base truncate text-foreground mb-2">{session.name}</h5>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-tight">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 opacity-40" />
          <span>{formatDate(session.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export const OverviewTab = ({
  company,
  sessions,
  sessionsLoading,
  handleOpenProject,
  handleNewProject,
  handleDeleteSession
}: OverviewTabProps) => {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const totalPaints = company?.catalogs?.reduce((s: number, c: any) => s + c.paints.length, 0) || 0;
  const activeCatalogs = company?.catalogs?.filter((c: any) => c.active).length || 0;

  // Navegação para cards estatísticos - seguindo exemplo da barra lateral
  const navigate = useNavigate();

  const handleStatCardClick = (type: string) => {
    switch (type) {
      case 'Projetos':
        // Já está na visão geral
        break;
      case 'Simulações':
        // Navegar para aba de catálogos (onde estão as cores)
        navigate('/dashboard?tab=catalogs');
        break;
      case 'Cores':
        // Navegar para aba de catálogos (onde estão as cores)
        navigate('/dashboard?tab=catalogs');
        break;
      case 'Catálogos':
        // Navegar para aba de catálogos (onde estão os catálogos)
        navigate('/dashboard?tab=catalogs');
        break;
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-fade-in">
      
      {/* ── HEADER UNIVERSAL ── */}
      <div className="flex flex-col gap-4 sm:gap-6 border-b border-border/40 pb-6 sm:pb-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-xs sm:text-sm">
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Painel Principal
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Visão Geral</h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-lg">
            Monitore o desempenho da sua vitrine e gerencie as simulações dos seus clientes.
          </p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Projetos"
            value={sessions.length}
            sub="Total criados"
            icon={FolderOpen}
            trend="+12%"
            onClick={() => handleStatCardClick('Projetos')}
          />
          <StatCard
            label="Simulações"
            value={sessions.reduce((acc: number, s: any) => acc + (s.rooms?.length || 0), 0)}
            sub="Este mês"
            icon={Layers}
            trend="+8%"
            onClick={() => handleStatCardClick('Simulações')}
          />
          <StatCard
            label="Cores"
            value={totalPaints}
            sub="No catálogo"
            icon={Palette}
            onClick={() => handleStatCardClick('Cores')}
          />
          <StatCard
            label="Catálogos"
            value={activeCatalogs}
            sub="Ativos"
            icon={TrendingUp}
            onClick={() => handleStatCardClick('Catálogos')}
          />
        </div>
      </div>

      {/* PROJETOS */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-bold text-foreground">Projetos Recentes</h3>
          <Button 
            size="sm" 
            onClick={handleNewProject}
            className="flex items-center gap-2 mobile-touch-target"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Projeto
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-video rounded-xl bg-slate-50 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 sm:py-16 text-center border border-dashed border-border/60 rounded-2xl bg-card">
            <div className="space-y-3">
              <FolderOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground/40" />
              <p className="text-sm sm:text-base text-muted-foreground font-medium">Nenhum projeto salvo no momento.</p>
              <Button size="sm" onClick={handleNewProject} className="mt-4 mobile-touch-target">
                <Plus className="w-3.5 h-3.5 mr-2" />
                Criar Primeiro Projeto
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sessions.map((session: any) => (
              <ProjectCard
                key={session.id}
                session={session}
                onOpen={handleOpenProject}
                onDelete={handleDeleteSession}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
