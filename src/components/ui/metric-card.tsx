import React from "react";
import { cn } from "@/lib/utils";

type AccentColor = "gold" | "loss" | "warning" | "info" | "gain";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  accentColor?: AccentColor;
  height?: number;
  className?: string;
}

const accentColorClasses: Record<AccentColor, string> = {
  gold: "bg-bts-gold",
  loss: "bg-bts-loss",
  warning: "bg-bts-warning",
  info: "bg-bts-info",
  gain: "bg-bts-gain",
};

export function MetricCard({
  label,
  value,
  subtext,
  accentColor = "gold",
  height,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-bts-surface shadow-bts-sm border border-bts-border",
        "flex flex-col",
        className
      )}
      style={height ? { height } : undefined}
    >
      {/* 2px accent bar — full bleed, no top border-radius */}
      <div className={cn("h-0.5 w-full", accentColorClasses[accentColor])} />
      <div className="flex flex-col gap-1 p-4">
        <p className="text-caption font-sans font-semibold uppercase tracking-wider text-bts-secondary">
          {label}
        </p>
        <p className="font-mono text-data-lg text-bts-primary">{value}</p>
        {subtext && (
          <p className="text-body-sm text-bts-tertiary">{subtext}</p>
        )}
      </div>
    </div>
  );
}
