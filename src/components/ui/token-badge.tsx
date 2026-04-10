import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenBadgeProps {
  tokens: number;
  className?: string;
}

export const TokenBadge = ({ tokens, className }: TokenBadgeProps) => {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border border-current/10 bg-current/5 transition-all shrink-0",
      className
    )}>
      <Sparkles className="w-3 h-3 opacity-60" />
      <span className="text-[10px] font-bold">{tokens}</span>
    </div>
  );
};
