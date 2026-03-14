"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  positionName: string;
  onSave: (data: { name: string; notes?: string }) => Promise<void>;
}

export function SettingsPanel({ positionName, onSave }: SettingsPanelProps) {
  const [name, setName] = useState(positionName);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ name, notes: notes || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Position Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Primary Treasury"
      />
      <div className="flex flex-col gap-1">
        <label className="text-caption font-semibold uppercase tracking-wider text-bts-secondary">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes about this position"
          rows={3}
          className="w-full rounded-md border border-bts-border bg-bts-surface px-3 py-2 text-body text-bts-primary placeholder:text-bts-tertiary focus:border-bts-gold focus:outline-none focus:ring-2 focus:ring-bts-gold-glow resize-none"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={cn(
          "rounded-md px-4 py-2 text-body-sm font-semibold transition-colors",
          saved
            ? "bg-bts-gain-dim text-bts-gain"
            : isSaving
            ? "bg-bts-surface-subtle text-bts-tertiary"
            : "bg-bts-surface-subtle text-bts-primary hover:bg-bts-border hover:text-bts-primary border border-bts-border"
        )}
      >
        {saved ? "Saved!" : isSaving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
