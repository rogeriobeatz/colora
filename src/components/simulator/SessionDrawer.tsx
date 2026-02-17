"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FolderOpen, Plus, Clock } from "lucide-react";

export type SessionListItem = {
  id: string;
  name: string;
  updatedAt: string;
};

interface SessionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionId: string | null;
  listSessions: () => Promise<SessionListItem[]>;
  onLoad: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNew: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

const SessionDrawer = ({
  open,
  onOpenChange,
  currentSessionId,
  listSessions,
  onLoad,
  onDelete,
  onNew,
}: SessionDrawerProps) => {
  const [items, setItems] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const list = await listSessions();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <span />
      </SheetTrigger>

      <SheetContent side="right" className="w-[360px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Projetos
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          <Button className="w-full gap-2" onClick={onNew}>
            <Plus className="w-4 h-4" />
            Novo projeto
          </Button>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {loading ? "Carregando..." : `${items.length} projeto(s) salvos`}
          </div>

          <ScrollArea className="h-[calc(100vh-210px)] pr-3">
            <div className="space-y-2">
              {items.map((s) => {
                const isCurrent = currentSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isCurrent ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="text-left flex-1"
                        onClick={async () => {
                          await onLoad(s.id);
                          onOpenChange(false);
                        }}
                        title="Abrir projeto"
                      >
                        <p className={`text-sm font-bold leading-snug ${isCurrent ? "text-primary" : "text-foreground"}`}>
                          {s.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Atualizado: {formatDate(s.updatedAt)}
                        </p>
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          await onDelete(s.id);
                          await refresh();
                        }}
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!loading && items.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum projeto salvo ainda.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionDrawer;