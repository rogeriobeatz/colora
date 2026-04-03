import { WallSimulation } from "./types";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationCardsProps {
  simulations: WallSimulation[];
  onRemove: (id: string) => void;
  variant?: "default" | "mini";
}

const SimulationCards = ({ simulations, onRemove, variant = "default" }: SimulationCardsProps) => {
  if (simulations.length === 0) return null;

  if (variant === "mini") {
    return (
      <div className="flex gap-2">
        {simulations.map((sim) => (
          <div
            key={sim.id}
            className="bg-white rounded-lg border border-border/60 overflow-hidden group relative flex-shrink-0 w-24 transition-all hover:border-primary/40 shadow-sm"
          >
            <div className="h-6 w-full" style={{ backgroundColor: sim.paint.hex }} />
            <div className="p-1.5">
              <p className="text-[9px] font-bold text-foreground truncate">{sim.paint.name}</p>
              <p className="text-[8px] font-mono text-muted-foreground truncate uppercase">{sim.paint.hex}</p>
            </div>
            <button
              onClick={() => onRemove(sim.id)}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Histórico de Cores</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {simulations.map((sim) => (
          <div
            key={sim.id}
            className="bg-card rounded-xl border border-border overflow-hidden group relative transition-all hover:shadow-md"
          >
            <div className="h-10 w-full" style={{ backgroundColor: sim.paint.hex }} />
            <div className="p-2.5">
              <p className="text-[10px] font-bold text-foreground truncate">{sim.paint.name}</p>
              <p className="text-[9px] font-medium text-muted-foreground truncate">
                {sim.wallLabel} · {sim.paint.hex}
              </p>
            </div>
            <button
              onClick={() => onRemove(sim.id)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-foreground/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationCards;
