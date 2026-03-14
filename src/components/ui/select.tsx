"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  placeholder?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  error,
  className,
  placeholder,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-caption font-sans font-semibold uppercase tracking-wider text-bts-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-md border border-bts-border bg-bts-surface px-3 py-2 pr-8",
            "text-body text-bts-primary",
            "transition-colors duration-base",
            "focus:border-bts-gold focus:outline-none focus:ring-2 focus:ring-bts-gold-glow",
            error && "border-bts-loss",
            className
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bts-secondary"
        />
      </div>
      {error && <p className="text-caption text-bts-loss">{error}</p>}
    </div>
  );
}
