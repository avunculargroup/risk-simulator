"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAlerts } from "@/hooks/use-alerts";
import type { AlertEvent } from "@/hooks/use-alerts";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const { events, acknowledge, refetch } = useAlerts();
  const [showForm, setShowForm] = useState(false);
  const [ruleType, setRuleType] = useState("price_below");
  const [severity, setSeverity] = useState("warning");
  const [threshold, setThreshold] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleType,
          severity,
          threshold: Number(threshold),
          label: label || undefined,
        }),
      });
      setShowForm(false);
      setThreshold("");
      setLabel("");
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-content mx-auto">
      <SectionHeader
        title="Alert Rules"
        subtitle="Configure threshold alerts for your BTC treasury"
        level="page"
        action={
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 rounded-md border border-bts-gold bg-bts-gold-glow px-3 py-2 text-body-sm font-semibold text-bts-gold-dark hover:bg-bts-gold-light transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Rule
          </button>
        }
      />

      {showForm && (
        <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm overflow-hidden">
          <div className="h-0.5 bg-bts-gold" />
          <form onSubmit={handleCreateRule} className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Rule Type"
                value={ruleType}
                onChange={setRuleType}
                options={[
                  { value: "price_above", label: "Price Above" },
                  { value: "price_below", label: "Price Below" },
                  { value: "var_exceeds", label: "VaR Exceeds" },
                  { value: "drawdown_exceeds", label: "Drawdown Exceeds" },
                  { value: "portfolio_value_below", label: "Portfolio Value Below" },
                ]}
              />
              <Select
                label="Severity"
                value={severity}
                onChange={setSeverity}
                options={[
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Threshold"
                type="number"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                placeholder="50000"
                numeric
                required
              />
              <Input
                label="Label (optional)"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g., BTC Below $50K"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-gradient-to-r from-bts-gold-dark to-bts-gold px-4 py-2 text-body-sm font-semibold text-[#1A1915]"
              >
                {isSubmitting ? "Saving..." : "Create Rule"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-body-sm text-bts-secondary hover:text-bts-primary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm p-4">
        <AlertPanel
          events={events}
          onAcknowledge={acknowledge}
        />
      </div>
    </div>
  );
}
