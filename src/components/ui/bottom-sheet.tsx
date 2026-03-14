"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "relative z-10 max-h-[85vh] overflow-y-auto",
          "rounded-t-xl bg-bts-surface shadow-bts-lg",
          "animate-slide-up"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-bts-border-light" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-bts-border px-4 py-3">
            <h3 className="font-display text-section-title text-bts-primary">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-bts-secondary hover:bg-bts-surface-subtle"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
