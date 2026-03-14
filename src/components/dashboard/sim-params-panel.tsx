"use client";

import React, { useState } from "react";
import { RefreshCw, Play } from "lucide-react";
import { EngineSelector } from "./engine-selector";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Engine = "monte_carlo" | "historical_replay" | "macro_correlated" | "custom_stress_test";

interface SimParamsPanelProps {
  onRunSimulation: (params: SimParams) => Promise<void>;
  isRunning?: boolean;
}

interface SimParams {
  engine: Engine;
  horizon: number;
  simulations: number;
  enableJumps?: boolean;
  scenarios?: Array<{ name: string; priceMovePct: number; timeHorizonDays: number }>;
}

export function SimParamsPanel({ onRunSimulation, isRunning }: SimParamsPanelProps) {
  const [engine, setEngine] = useState<Engine>("monte_carlo");
  const [horizon, setHorizon] = useState(30);
  const [simulations, setSimulations] = useState(1000);
  const [enableJumps, setEnableJumps] = useState(false);

  const handleRun = async () => {
    const params: SimParams = { engine, horizon, simulations };
    if (engine === "monte_carlo") params.enableJumps = enableJumps;
    await onRunSimulation(params);
  };

  return (
    <div className="flex flex-col gap-5">
      <EngineSelector value={engine} onChange={setEngine} />

      {(engine === "monte_carlo" || engine === "historical_replay") && (
        <Input
          label="Horizon (days)"
          type="number"
          value={horizon}
          onChange={e => setHorizon(Number(e.target.value))}
          min={1}
          max={365}
          numeric
        />
      )}

      {engine === "monte_carlo" && (
        <>
          <Input
            label="Simulations"
            type="number"
            value={simulations}
            onChange={e => setSimulations(Number(e.target.value))}
            min={100}
            max={10000}
            numeric
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableJumps}
              onChange={e => setEnableJumps(e.target.checked)}
              className="rounded border-bts-border accent-bts-gold"
            />
            <span className="text-body-sm text-bts-secondary">Enable jump diffusion</span>
          </label>
        </>
      )}

      {engine === "custom_stress_test" && (
        <div className="rounded-md bg-bts-surface-subtle p-3">
          <p className="text-body-sm text-bts-tertiary">
            Stress test scenarios can be configured in the Stress Test panel below.
          </p>
        </div>
      )}

      {engine === "macro_correlated" && (
        <div className="rounded-md bg-bts-warning-dim border border-bts-warning-dim p-3">
          <p className="text-body-sm text-bts-warning">
            Macro-correlated simulation requires FRED & Alpha Vantage API keys (Phase 3 feature).
          </p>
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={isRunning}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md px-4 py-3",
          "text-body font-semibold transition-all duration-base",
          isRunning
            ? "cursor-not-allowed bg-bts-surface-subtle text-bts-tertiary"
            : "bg-gradient-to-r from-bts-gold-dark to-bts-gold text-[#1A1915] hover:opacity-90 shadow-bts-sm"
        )}
      >
        {isRunning ? (
          <>
            <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play size={16} strokeWidth={1.5} />
            Run Simulation
          </>
        )}
      </button>
    </div>
  );
}
