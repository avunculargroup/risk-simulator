"use client";

import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { LotTable } from "@/components/position/lot-table";
import { AddLotForm } from "@/components/position/add-lot-form";
import { CsvImport } from "@/components/position/csv-import";
import { WhatIfPanel } from "@/components/position/what-if-panel";
import { SettingsPanel } from "@/components/position/settings-panel";
import type { TreasuryLot } from "@/db/queries/positions";

type Tab = "lots" | "import" | "what-if" | "settings";

export default function PositionPage() {
  const [lots, setLots] = useState<TreasuryLot[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("lots");
  const [positionName, setPositionName] = useState("Primary Treasury");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [posRes, priceRes] = await Promise.all([
        fetch("/api/position"),
        fetch("/api/price/current"),
      ]);
      const posJson = await posRes.json();
      const priceJson = await priceRes.json();
      if (posJson.data?.lots) setLots(posJson.data.lots);
      if (posJson.data?.position) setPositionName(posJson.data.position.name);
      if (priceJson.data) setCurrentPrice(priceJson.data.price);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddLot = async (data: {
    btcAmount: number;
    purchasePrice: number;
    purchaseDate: string;
    label?: string;
  }) => {
    const res = await fetch("/api/position/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchData();
  };

  const handleDeleteLot = async (id: string) => {
    if (!confirm("Delete this lot?")) return;
    await fetch(`/api/position/lots/${id}`, { method: "DELETE" });
    setLots(prev => prev.filter(l => l.id !== id));
  };

  const handleSaveSettings = async (data: { name: string; notes?: string }) => {
    await fetch("/api/position", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setPositionName(data.name);
  };

  const totalBtc = lots.reduce((sum, l) => sum + Number(l.btcAmount), 0);
  const totalValue = totalBtc * currentPrice;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "lots", label: "Lots" },
    { id: "import", label: "Import" },
    { id: "what-if", label: "What-If" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-content mx-auto">
      <SectionHeader
        title="Position Management"
        subtitle={positionName}
        level="page"
        action={<AddLotForm onAdd={handleAddLot} />}
      />

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-bts-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-body-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-bts-gold text-bts-primary"
                : "border-transparent text-bts-secondary hover:text-bts-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl bg-bts-surface border border-bts-border shadow-bts-sm p-4">
        {activeTab === "lots" && (
          isLoading ? (
            <div className="flex justify-center py-8 text-body-sm text-bts-tertiary">Loading...</div>
          ) : (
            <LotTable
              lots={lots}
              currentPrice={currentPrice}
              onDelete={handleDeleteLot}
            />
          )
        )}
        {activeTab === "import" && (
          <CsvImport onImport={() => fetchData()} />
        )}
        {activeTab === "what-if" && (
          <WhatIfPanel
            currentTotalBtc={totalBtc}
            currentValue={totalValue}
            currentPrice={currentPrice}
          />
        )}
        {activeTab === "settings" && (
          <SettingsPanel
            positionName={positionName}
            onSave={handleSaveSettings}
          />
        )}
      </div>
    </div>
  );
}
