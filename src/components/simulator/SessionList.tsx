import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, Trash2, Clock, Play, Plus, Loader2 } from "lucide-react";
import { SessionListItem } from "./SessionDrawer";

interface SessionListProps {
  companyPrimaryColor?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SessionList = ({ companyPrimaryColor }: SessionListProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const listSessions = async (): Promise<SessionListItem[]> => {
    const { listSimulatorSessions } = await import("@/lib/simulator-db");
    const list = await listSimulatorSessions();
    return list.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt }));
  };

  const loadSessions = async () => {
    setLoading(true);
    const list = await listSessions();
    setItems(list);
    setLoading(false);
  };

  const deleteSession = async (id: string) => {
    const { deleteSimulatorSession } = await import("@/lib/simulator-db");
    await deleteSimulatorSession(id);
    await loadSessions();
  };

  const openSession = (id: string) => {
    // Salva o ID da sessão para ser carregado ao abrir o simulador
    localStorage.setItem("colora_pending_session", id);
    navigate("/simulator");
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Sessões Salvas
        </h3>
        <span className="text-xs text-muted-foreground">
          {loading ? "..." : `${items.length} sessão(ões)`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 px-4 bg-muted/30 rounded-xl border border-dashed border-border">
          <FolderOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma sessão salva ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Comece uma simulação e ela será salva automaticamente
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-2">
            {items.map((s) => (
              <div
                key={s.id}
                className="group bg-card rounded-xl border border-border p-4 hover:shadow-soft transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="text-left flex-1 min-w-0"
                    onClick={() => openSession(s.id)}
                  >
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(s.updatedAt)}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openSession(s.id)}
                      title="Abrir sessão"
                      style={{ color: companyPrimaryColor }}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteSession(s.id)}
                      title="Excluir sessão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SessionList;