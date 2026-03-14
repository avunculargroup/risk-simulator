"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { RiskMetrics } from "@/engine/types";
import { formatUSD } from "@/lib/utils";

interface LossDistributionProps {
  terminalPrices?: number[];
  currentPrice: number;
  metrics: RiskMetrics;
  height?: number;
}

function buildHistogram(
  terminalPrices: number[],
  currentPrice: number,
  bins = 30
): Array<{ bin: number; count: number; return: number }> {
  if (!terminalPrices.length) return [];

  const returns = terminalPrices.map(p => (p - currentPrice) / currentPrice);
  const min = Math.min(...returns);
  const max = Math.max(...returns);
  const binWidth = (max - min) / bins;

  const histogram: Array<{ bin: number; count: number; return: number }> = [];
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = returns.filter(r => r >= binStart && (i === bins - 1 ? r <= binEnd : r < binEnd)).length;
    histogram.push({
      bin: i,
      count,
      return: (binStart + binEnd) / 2,
    });
  }
  return histogram;
}

export function LossDistribution({
  terminalPrices,
  currentPrice,
  metrics,
  height = 200,
}: LossDistributionProps) {
  // Build histogram from terminal prices if available
  const data = terminalPrices?.length
    ? buildHistogram(terminalPrices, currentPrice)
    : [];

  const var95Pct = metrics.var95 / currentPrice; // as fraction

  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div
          className="flex items-center justify-center text-body-sm text-bts-tertiary"
          style={{ height }}
        >
          Run a simulation to see the loss distribution
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 40 }}>
            <XAxis
              dataKey="return"
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-text-secondary)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => [value, "Paths"]}
              labelFormatter={(label: number) => `Return: ${(label * 100).toFixed(1)}%`}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <ReferenceLine
              x={var95Pct}
              stroke="var(--color-loss)"
              strokeDasharray="4 2"
              label={{ value: "VaR 95%", fill: "var(--color-loss)", fontSize: 10 }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map(entry => (
                <Cell
                  key={entry.bin}
                  fill={entry.return < 0 ? "var(--color-loss)" : "var(--color-gain)"}
                  fillOpacity={entry.return < var95Pct ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
