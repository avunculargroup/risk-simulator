import React from "react";
import type { PositionSnapshot } from "@/engine/types";
import { formatBTC, formatUSD, formatPercent, getPnLColor } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionSummaryCardProps {
  position: PositionSnapshot;
}

export function PositionSummaryCard({ position }: PositionSummaryCardProps) {
  const isGain = position.unrealizedPnl >= 0;

  return (
    <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm overflow-hidden">
      <div className="h-0.5 w-full bg-bts-gold" />
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-bts-secondary">
            Holdings
          </p>
          <p className="font-mono text-data-md text-bts-primary mt-1">
            {formatBTC(position.totalBtc)}
          </p>
        </div>
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-bts-secondary">
            Current Value
          </p>
          <p className="font-mono text-data-md text-bts-primary mt-1">
            {formatUSD(position.currentValue)}
          </p>
        </div>
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-bts-secondary">
            Cost Basis
          </p>
          <p className="font-mono text-data-md text-bts-primary mt-1">
            {formatUSD(position.totalCostBasis)}
          </p>
        </div>
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-bts-secondary">
            Unrealized P&L
          </p>
          <div className="flex items-center gap-1 mt-1">
            {isGain ? (
              <TrendingUp size={14} strokeWidth={1.5} className="text-bts-gain" />
            ) : (
              <TrendingDown size={14} strokeWidth={1.5} className="text-bts-loss" />
            )}
            <p className={cn("font-mono text-data-md", getPnLColor(position.unrealizedPnl))}>
              {formatUSD(position.unrealizedPnl)} ({formatPercent(position.unrealizedPnlPct)})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
