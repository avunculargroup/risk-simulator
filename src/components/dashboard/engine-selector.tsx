"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Engine = "monte_carlo" | "historical_replay" | "macro_correlated" | "custom_stress_test";

interface EngineSelectorProps {
  value: Engine;
  onChange: (engine: Engine) => void;
}

const engines: Array<{ value: Engine; label: string; shortLabel: string; description: string }> = [
  {
    value: "monte_carlo",
    label: "Monte Carlo",
    shortLabel: "MC",
    description: "GARCH + Student-t with optional jump diffusion",
  },
  {
    value: "historical_replay",
    label: "Historical Replay",
    shortLabel: "Hist",
    description: "Empirical distribution from actual BTC history",
  },
  {
    value: "macro_correlated",
    label: "Macro-Correlated",
    shortLabel: "Macro",
    description: "Correlates with DXY, SPX, VIX (Phase 3)",
  },
  {
    value: "custom_stress_test",
    label: "Stress Test",
    shortLabel: "Stress",
    description: "Custom scenario analysis",
  },
];

export function EngineSelector({ value, onChange }: EngineSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption font-sans font-semibold uppercase tracking-wider text-bts-secondary">
        Simulation Engine
      </p>
      <div className="flex gap-1 rounded-lg bg-bts-surface-subtle p-1">
        {engines.map(engine => (
          <button
            key={engine.value}
            onClick={() => onChange(engine.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-caption font-semibold transition-colors duration-base",
              "min-w-0 truncate",
              value === engine.value
                ? "bg-bts-surface text-bts-primary shadow-bts-sm"
                : "text-bts-secondary hover:text-bts-primary"
            )}
            title={engine.description}
          >
            <span className="hidden sm:inline">{engine.label}</span>
            <span className="sm:hidden">{engine.shortLabel}</span>
          </button>
        ))}
      </div>
      <p className="text-caption text-bts-tertiary">
        {engines.find(e => e.value === value)?.description}
      </p>
    </div>
  );
}
