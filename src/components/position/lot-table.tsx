"use client";

import React from "react";
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { TreasuryLot } from "@/db/queries/positions";
import { formatBTC, formatUSD, formatPercent, getPnLColor, cn } from "@/lib/utils";

interface LotTableProps {
  lots: TreasuryLot[];
  currentPrice: number;
  onEdit?: (lot: TreasuryLot) => void;
  onDelete?: (id: string) => void;
}

export function LotTable({ lots, currentPrice, onEdit, onDelete }: LotTableProps) {
  const totalBtc = lots.reduce((sum, l) => sum + Number(l.btcAmount), 0);

  if (lots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-body text-bts-secondary">No treasury lots yet</p>
        <p className="text-body-sm text-bts-tertiary">
          Add your first BTC purchase to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-bts-border">
            {["Date", "BTC Amount", "Purchase Price", "Current Value", "P&L", "Allocation", ""].map(h => (
              <th key={h} className="pb-2 pr-4 text-caption font-semibold uppercase tracking-wider text-bts-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lots.map((lot, idx) => {
            const btcAmount = Number(lot.btcAmount);
            const purchasePrice = Number(lot.purchasePrice);
            const costBasis = btcAmount * purchasePrice;
            const currentValue = btcAmount * currentPrice;
            const pnl = currentValue - costBasis;
            const pnlPct = costBasis > 0 ? pnl / costBasis : 0;
            const allocationPct = totalBtc > 0 ? btcAmount / totalBtc : 0;
            const isGain = pnl >= 0;

            return (
              <tr
                key={lot.id}
                className={cn(
                  "group border-b border-bts-border/50 hover:bg-bts-surface-subtle transition-colors",
                  idx % 2 === 0 ? "" : "bg-bts-surface-subtle/50"
                )}
              >
                <td className="py-3 pr-4 text-body-sm text-bts-secondary">
                  {new Date(lot.purchaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-3 pr-4 font-mono text-data-sm text-bts-primary">
                  {formatBTC(btcAmount)}
                </td>
                <td className="py-3 pr-4 font-mono text-data-sm text-bts-primary">
                  {formatUSD(purchasePrice)}
                </td>
                <td className="py-3 pr-4 font-mono text-data-sm text-bts-primary">
                  {formatUSD(currentValue)}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1">
                    {isGain ? (
                      <TrendingUp size={12} strokeWidth={1.5} className="text-bts-gain" />
                    ) : (
                      <TrendingDown size={12} strokeWidth={1.5} className="text-bts-loss" />
                    )}
                    <span className={cn("font-mono text-data-sm", getPnLColor(pnl))}>
                      {formatPercent(pnlPct)}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 rounded-full bg-bts-surface-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full bg-bts-gold"
                        style={{ width: `${allocationPct * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-data-sm text-bts-secondary">
                      {(allocationPct * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(lot)}
                        className="rounded p-1.5 text-bts-tertiary hover:text-bts-primary hover:bg-bts-surface-subtle"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(lot.id)}
                        className="rounded p-1.5 text-bts-tertiary hover:text-bts-loss hover:bg-bts-loss-dim"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
