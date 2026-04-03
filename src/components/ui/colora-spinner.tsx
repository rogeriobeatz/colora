import React from "react";
import { cn } from "@/lib/utils";

interface ColoraSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const ColoraSpinner = ({ className, size = "md" }: ColoraSpinnerProps) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      {/* Animated spinner ring */}
      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      {/* Colora Icon in the center */}
      <img 
        src="/colora-icon.svg" 
        alt="Colora" 
        className={cn(
          "relative z-10 transition-all duration-300",
          size === "sm" ? "w-3 h-3" : 
          size === "md" ? "w-5 h-5" : 
          size === "lg" ? "w-8 h-8" : "w-12 h-12"
        )} 
      />
    </div>
  );
};
