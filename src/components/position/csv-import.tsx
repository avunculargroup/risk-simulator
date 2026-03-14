"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface CsvImportProps {
  onImport: (result: ImportResult) => void;
}

export function CsvImport({ onImport }: CsvImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/position/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");

      setResult(json.data);
      onImport(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-bts-gold bg-bts-gold-glow"
            : "border-bts-border bg-bts-surface-subtle hover:border-bts-border-light"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} strokeWidth={1.5} className="animate-bounce text-bts-gold" />
            <p className="text-body-sm text-bts-secondary">Importing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileText size={24} strokeWidth={1.5} className="text-bts-tertiary" />
            <p className="text-body-sm text-bts-secondary">
              Drop a CSV file here, or click to browse
            </p>
            <p className="text-caption text-bts-tertiary">
              Columns: date, btc_amount, purchase_price (label optional)
            </p>
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-lg border border-bts-border bg-bts-surface p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} strokeWidth={1.5} className="text-bts-gain" />
            <span className="text-body-sm text-bts-secondary">
              {result.success} lots imported successfully
            </span>
          </div>
          {result.failed > 0 && (
            <div className="flex items-center gap-2">
              <XCircle size={14} strokeWidth={1.5} className="text-bts-loss" />
              <span className="text-body-sm text-bts-loss">
                {result.failed} rows failed
              </span>
            </div>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {result.errors.slice(0, 3).map((e, i) => (
                <li key={i} className="text-caption text-bts-tertiary">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="text-body-sm text-bts-loss">{error}</p>
      )}
    </div>
  );
}
