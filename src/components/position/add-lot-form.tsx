"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatUSD } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface AddLotFormProps {
  onAdd: (data: {
    btcAmount: number;
    purchasePrice: number;
    purchaseDate: string;
    label?: string;
  }) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AddLotForm({ onAdd, isOpen: externalIsOpen, onClose }: AddLotFormProps) {
  const [isOpen, setIsOpen] = useState(externalIsOpen ?? false);
  const [btcAmount, setBtcAmount] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewValue =
    btcAmount && purchasePrice
      ? formatUSD(Number(btcAmount) * Number(purchasePrice))
      : null;

  const open = externalIsOpen ?? isOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onAdd({
        btcAmount: Number(btcAmount),
        purchasePrice: Number(purchasePrice),
        purchaseDate: new Date(purchaseDate).toISOString(),
        label: label || undefined,
      });
      setBtcAmount("");
      setPurchasePrice("");
      setLabel("");
      setIsOpen(false);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add lot");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md border border-bts-gold bg-bts-gold-glow px-3 py-2 text-body-sm font-semibold text-bts-gold-dark hover:bg-bts-gold-light transition-colors"
      >
        <Plus size={14} strokeWidth={1.5} />
        Add Lot
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-bts-border bg-bts-surface shadow-bts-md overflow-hidden">
      <div className="h-0.5 bg-bts-gold" />
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-subsection text-bts-primary">Add Treasury Lot</h3>
          <button
            onClick={() => { setIsOpen(false); onClose?.(); }}
            className="rounded p-1 text-bts-tertiary hover:text-bts-secondary"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="BTC Amount"
              type="number"
              value={btcAmount}
              onChange={e => setBtcAmount(e.target.value)}
              placeholder="0.00000000"
              step="0.00000001"
              min="0.00000001"
              numeric
              required
            />
            <Input
              label="Purchase Price (USD)"
              type="number"
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              placeholder="50000.00"
              prefix="$"
              min="1"
              numeric
              required
            />
          </div>

          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={e => setPurchaseDate(e.target.value)}
            required
          />

          <Input
            label="Label (optional)"
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g., Q1 2024 purchase"
          />

          {previewValue && (
            <p className="text-body-sm text-bts-tertiary">
              Total cost basis: <span className="font-mono font-semibold text-bts-secondary">{previewValue}</span>
            </p>
          )}

          {error && <p className="text-body-sm text-bts-loss">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "rounded-md px-4 py-2.5 text-body font-semibold transition-colors",
              isSubmitting
                ? "bg-bts-surface-subtle text-bts-tertiary cursor-not-allowed"
                : "bg-gradient-to-r from-bts-gold-dark to-bts-gold text-[#1A1915] hover:opacity-90"
            )}
          >
            {isSubmitting ? "Adding..." : "Add Lot"}
          </button>
        </form>
      </div>
    </div>
  );
}
