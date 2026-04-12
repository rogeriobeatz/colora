import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  variant?: "dashboard" | "simulator";
  className?: string;
}

export const TrialBanner = ({ variant = "dashboard", className }: TrialBannerProps) => {
  const { company } = useStore();
  const navigate = useNavigate();

  if (!company || company.accountType !== 'trial') return null;

  const tokensLeft = company.tokens ?? 0;
  const isOutOfTokens = tokensLeft <= 0;

  if (variant === "simulator") {
    return (
      <div className={cn(
        "mx-4 mb-4 p-4 rounded-2xl border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800",
        className
      )}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {isOutOfTokens ? "Seus tokens de teste acabaram" : `Você tem ${tokensLeft} simulação${tokensLeft !== 1 ? 'ões' : ''} grátis`}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {isOutOfTokens ? "Assine para continuar simulando" : "Assine para ter 200 simulações/mês"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/checkout")}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 flex-shrink-0"
          >
            Assinar agora <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 border-primary/20",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground mb-1">
            {isOutOfTokens ? "Seus tokens de teste acabaram!" : "Você está no modo teste"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isOutOfTokens
              ? "Assine o Colora Pro para ter 200 simulações por mês, catálogos personalizados, identidade visual da sua marca e muito mais."
              : `Você ainda tem ${tokensLeft} simulação${tokensLeft !== 1 ? 'ões' : ''} grátis. Assine para ter acesso completo com 200 simulações/mês, catálogos personalizados e branding da sua loja.`
            }
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={() => navigate("/checkout")} className="gap-2">
              <Zap className="w-4 h-4" /> Assinar por R$ 59,90/mês
            </Button>
            {!isOutOfTokens && (
              <span className="text-xs text-muted-foreground">
                {tokensLeft} token{tokensLeft !== 1 ? 's' : ''} restante{tokensLeft !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
