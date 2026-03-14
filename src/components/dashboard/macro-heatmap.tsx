"use client";

import React from "react";

interface MacroHeatmapProps {
  correlations?: Record<string, number>;
  height?: number;
}

const MACRO_LABELS: Record<string, string> = {
  DXY: "US Dollar (DXY)",
  SPX: "S&P 500",
  VIX: "VIX",
  DGS10: "10-Yr Yield",
  XAUUSD: "Gold",
};

function getColor(correlation: number): string {
  if (correlation > 0.5) return "var(--color-gain)";
  if (correlation > 0.1) return "var(--color-gain-dim)";
  if (correlation < -0.5) return "var(--color-loss)";
  if (correlation < -0.1) return "var(--color-loss-dim)";
  return "var(--color-surface-subtle)";
}

export function MacroHeatmap({ correlations, height = 200 }: MacroHeatmapProps) {
  if (!correlations || Object.keys(correlations).length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 text-center"
        style={{ height }}
      >
        <p className="text-body-sm text-bts-tertiary">No macro data available</p>
        <p className="text-caption text-bts-tertiary">
          Configure FRED and Alpha Vantage API keys to enable macro correlation analysis
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" style={{ minHeight: height }}>
      {Object.entries(correlations).map(([ticker, corr]) => (
        <div
          key={ticker}
          className="flex flex-col items-center justify-center rounded-md p-3 gap-1"
          style={{ background: getColor(corr) }}
        >
          <p className="text-caption font-semibold text-bts-secondary">
            {MACRO_LABELS[ticker] ?? ticker}
          </p>
          <p className="font-mono text-data-md text-bts-primary">
            {corr >= 0 ? "+" : ""}{(corr * 100).toFixed(0)}%
          </p>
        </div>
      ))}
    </div>
  );
}
