import React from "react";
import { cn } from "@/lib/utils";

type PillVariant = "default" | "gain" | "loss" | "warning" | "info" | "gold";

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantClasses: Record<PillVariant, string> = {
  default: "bg-bts-surface-subtle text-bts-secondary border border-bts-border",
  gain: "bg-bts-gain-dim text-bts-gain",
  loss: "bg-bts-loss-dim text-bts-loss",
  warning: "bg-bts-warning-dim text-bts-warning",
  info: "bg-bts-info-dim text-bts-info",
  gold: "bg-bts-gold-glow text-bts-gold-dark",
};

export function Pill({ children, variant = "default", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-caption font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
