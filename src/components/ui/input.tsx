"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  numeric?: boolean;
}

export function Input({
  label,
  error,
  prefix,
  suffix,
  numeric,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-caption font-sans font-semibold uppercase tracking-wider text-bts-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-body-sm text-bts-secondary font-mono select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-md border border-bts-border bg-bts-surface px-3 py-2 text-body text-bts-primary",
            "placeholder:text-bts-tertiary",
            "transition-colors duration-base",
            "focus:border-bts-gold focus:outline-none focus:ring-2 focus:ring-bts-gold-glow",
            error && "border-bts-loss focus:border-bts-loss focus:ring-bts-loss-dim",
            numeric && "font-mono",
            prefix && "pl-7",
            suffix && "pr-10",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-body-sm text-bts-secondary font-mono select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-caption text-bts-loss">{error}</p>
      )}
    </div>
  );
}
