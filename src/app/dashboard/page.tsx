"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FanChart } from "@/components/dashboard/fan-chart";
import { LossDistribution } from "@/components/dashboard/loss-distribution";
import { SmartSummary } from "@/components/dashboard/smart-summary";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { SimParamsPanel } from "@/components/dashboard/sim-params-panel";
import { PositionSummaryCard } from "@/components/dashboard/position-summary-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useAlerts, type AlertEvent } from "@/hooks/use-alerts";
import { useSimulation } from "@/hooks/use-simulation";
import { formatUSD, formatPercent, formatBTC } from "@/lib/utils";
import type { PositionSnapshot } from "@/engine/types";
import { Settings2 } from "lucide-react";

interface SimParams {
  engine: "monte_carlo" | "historical_replay" | "macro_correlated" | "custom_stress_test";
  horizon: number;
  simulations: number;
  enableJumps?: boolean;
}

export default function DashboardPage() {
  const breakpoint = useBreakpoint();
  const { events, acknowledge } = useAlerts();
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [position, setPosition] = useState<PositionSnapshot | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const { data: simData } = useSimulation(currentRunId);

  // Fetch position and price on load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [posRes, priceRes] = await Promise.all([
          fetch("/api/position"),
          fetch("/api/price/current"),
        ]);
        const posJson = await posRes.json();
        const priceJson = await priceRes.json();

        if (posJson.data) {
          const { position: pos, lots, metrics } = posJson.data;
          if (metrics) {
            setPosition({
              id: pos.id,
              userId: pos.userId,
              name: pos.name,
              lots: lots.map((l: { id: string; btcAmount: string; purchasePrice: string; purchaseDate: string; label?: string }) => ({
                id: l.id,
                btcAmount: Number(l.btcAmount),
                purchasePrice: Number(l.purchasePrice),
                purchaseDate: new Date(l.purchaseDate),
                label: l.label,
              })),
              totalBtc: metrics.totalBtc,
              totalCostBasis: metrics.totalCostBasis,
              currentPrice: metrics.currentPrice,
              currentValue: metrics.currentValue,
              unrealizedPnl: metrics.unrealizedPnl,
              unrealizedPnlPct: metrics.unrealizedPnlPct,
            });
          }
        }
        if (priceJson.data) setCurrentPrice(priceJson.data.price);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };

    loadData();
  }, []);

  // Fetch latest simulation on load
  useEffect(() => {
    const loadLatestSim = async () => {
      try {
        const res = await fetch("/api/simulation/history?limit=1");
        const json = await res.json();
        if (json.data?.[0]) setCurrentRunId(json.data[0].id);
      } catch {}
    };
    loadLatestSim();
  }, []);

  const handleRunSimulation = async (params: SimParams) => {
    setIsRunning(true);
    setShowParams(false);
    try {
      const res = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCurrentRunId(json.data.runId);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const metrics = simData?.run?.status === "completed" ? simData.metrics : null;
  const bands = simData?.bands ?? null;
  const simStatus = isRunning
    ? "running"
    : simData?.run?.status ?? "idle";

  const simulationRunning = simStatus === "running" || simStatus === "pending";

  return (
    <div className="flex flex-col gap-6 max-w-dashboard mx-auto">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Risk Dashboard"
          subtitle={currentPrice > 0 ? `BTC: ${formatUSD(currentPrice)}` : "Loading price..."}
          level="page"
        />
        {breakpoint === "mobile" && (
          <button
            onClick={() => setShowParams(true)}
            className="flex items-center gap-1.5 rounded-md border border-bts-gold bg-bts-gold-glow px-3 py-2 text-body-sm font-semibold text-bts-gold-dark"
          >
            <Settings2 size={14} strokeWidth={1.5} />
            Simulate
          </button>
        )}
      </div>

      {/* Position summary */}
      {position && (
        <PositionSummaryCard position={position} />
      )}

      {/* Main layout: params sidebar + chart area */}
      <div className="flex gap-6">
        {/* Desktop sim params sidebar */}
        {breakpoint !== "mobile" && (
          <div className="w-64 flex-shrink-0">
            <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm p-4">
              <SimParamsPanel
                onRunSimulation={handleRunSimulation}
                isRunning={simulationRunning}
              />
            </div>
          </div>
        )}

        {/* Chart area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Fan chart */}
          <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-section-title text-bts-primary">Price Projection</h3>
              {simulationRunning && (
                <span className="text-caption text-bts-tertiary animate-pulse">Running...</span>
              )}
            </div>
            {bands ? (
              <FanChart
                bands={bands}
                currentPrice={currentPrice}
                height={280}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-body-sm text-bts-tertiary">
                Run a simulation to see the price projection fan chart
              </div>
            )}
          </div>

          {/* Metrics row */}
          {metrics && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="VaR 95%"
                value={formatUSD(Math.abs(Number(metrics.var95)))}
                subtext="95th percentile loss"
                accentColor="loss"
              />
              <MetricCard
                label="CVaR 95%"
                value={formatUSD(Math.abs(Number(metrics.cvar95)))}
                subtext="Expected shortfall"
                accentColor="warning"
              />
              <MetricCard
                label="Max Drawdown"
                value={formatPercent(-Number(metrics.maxDrawdown))}
                subtext="Worst simulated"
                accentColor="loss"
              />
              <MetricCard
                label="Prob. of Loss"
                value={`${(Number(metrics.probLoss) * 100).toFixed(1)}%`}
                subtext="Terminal period"
                accentColor={Number(metrics.probLoss) > 0.4 ? "loss" : "warning"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Smart summary */}
        {simData?.run?.status === "completed" && (
          <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm p-4 lg:col-span-2">
            <SmartSummary
              narrative={{
                headline: "Simulation Complete",
                paragraphs: [],
                keyInsights: metrics
                  ? [
                      `VaR 95%: ${formatUSD(Math.abs(Number(metrics.var95)))}`,
                      `Median terminal price: ${formatUSD(Number(metrics.terminalPriceMedian))}`,
                    ]
                  : [],
              }}
            />
          </div>
        )}

        {/* Alerts */}
        <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm p-4">
          <AlertPanel
            events={events}
            onAcknowledge={acknowledge}
          />
        </div>
      </div>

      {/* Mobile sim params bottom sheet */}
      <BottomSheet
        isOpen={showParams}
        onClose={() => setShowParams(false)}
        title="Run Simulation"
      >
        <SimParamsPanel
          onRunSimulation={handleRunSimulation}
          isRunning={simulationRunning}
        />
      </BottomSheet>
    </div>
  );
}
