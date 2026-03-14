"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatUSD, formatBTC, formatPercent } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface WhatIfPanelProps {
  currentTotalBtc: number;
  currentValue: number;
  currentPrice: number;
}

export function WhatIfPanel({ currentTotalBtc, currentValue, currentPrice }: WhatIfPanelProps) {
  const [additionalBtc, setAdditionalBtc] = useState("");
  const [buyPrice, setBuyPrice] = useState(currentPrice.toString());

  const addBtc = Number(additionalBtc) || 0;
  const atPrice = Number(buyPrice) || currentPrice;
  const newTotalBtc = currentTotalBtc + addBtc;
  const addedCost = addBtc * atPrice;
  const newValue = newTotalBtc * currentPrice;

  return (
    <div className="rounded-xl border border-bts-border bg-bts-surface shadow-bts-sm overflow-hidden">
      <div className="h-0.5" style={{ background: "var(--color-info)" }} />
      <div className="p-4 flex flex-col gap-4">
        <h3 className="font-display text-subsection text-bts-primary">What-If Analysis</h3>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Additional BTC"
            type="number"
            value={additionalBtc}
            onChange={e => setAdditionalBtc(e.target.value)}
            placeholder="0.0"
            step="0.001"
            numeric
          />
          <Input
            label="Buy Price (USD)"
            type="number"
            value={buyPrice}
            onChange={e => setBuyPrice(e.target.value)}
            placeholder={currentPrice.toString()}
            prefix="$"
            numeric
          />
        </div>

        {addBtc > 0 && (
          <div className="rounded-md bg-bts-surface-subtle border border-bts-border p-3">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-caption text-bts-secondary">
                  <th className="text-left pb-2">Metric</th>
                  <th className="text-right pb-2">Current</th>
                  <th className="text-center pb-2 text-bts-tertiary">→</th>
                  <th className="text-right pb-2 text-bts-gold-dark">Proposed</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr>
                  <td className="text-bts-secondary py-1">Total BTC</td>
                  <td className="text-right text-bts-primary">{formatBTC(currentTotalBtc)}</td>
                  <td className="text-center text-bts-tertiary">
                    <ArrowRight size={12} strokeWidth={1.5} className="inline" />
                  </td>
                  <td className="text-right text-bts-gold-dark">{formatBTC(newTotalBtc)}</td>
                </tr>
                <tr>
                  <td className="text-bts-secondary py-1">Portfolio Value</td>
                  <td className="text-right text-bts-primary">{formatUSD(currentValue)}</td>
                  <td className="text-center text-bts-tertiary">
                    <ArrowRight size={12} strokeWidth={1.5} className="inline" />
                  </td>
                  <td className="text-right text-bts-gold-dark">{formatUSD(newValue)}</td>
                </tr>
                <tr>
                  <td className="text-bts-secondary py-1">Cost of Addition</td>
                  <td className="text-right text-bts-tertiary">—</td>
                  <td className="text-center text-bts-tertiary">
                    <ArrowRight size={12} strokeWidth={1.5} className="inline" />
                  </td>
                  <td className="text-right text-bts-gold-dark">{formatUSD(addedCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
