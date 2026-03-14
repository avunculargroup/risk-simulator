"use client";

import React from "react";
import { Bell } from "lucide-react";
import type { AlertEvent as AlertEventWithRule } from "@/hooks/use-alerts";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/pill";

interface AlertPanelProps {
  events: AlertEventWithRule[];
  onAcknowledge?: (eventId: string) => void;
}

const severityDotClass: Record<string, string> = {
  critical: "bg-bts-loss",
  warning: "bg-bts-warning",
  info: "bg-bts-info",
};

const severityPillVariant: Record<string, "loss" | "warning" | "info"> = {
  critical: "loss",
  warning: "warning",
  info: "info",
};

export function AlertPanel({ events, onAcknowledge }: AlertPanelProps) {
  const unacknowledged = events.filter(e => !e.acknowledged);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={14} strokeWidth={1.5} className="text-bts-secondary" />
          <span className="text-caption font-semibold uppercase tracking-wider text-bts-secondary">
            Alerts
          </span>
        </div>
        {unacknowledged.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bts-loss text-caption font-bold text-white">
            {unacknowledged.length}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-body-sm text-bts-tertiary">No recent alerts</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.slice(0, 10).map(event => (
            <div
              key={event.id}
              className={cn(
                "flex items-start gap-3 rounded-md p-3",
                event.acknowledged
                  ? "bg-bts-surface-subtle"
                  : "bg-bts-surface border border-bts-border"
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                  event.acknowledged
                    ? "bg-bts-border"
                    : severityDotClass[event.rule.severity] ?? "bg-bts-border"
                )}
              />
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-body-sm font-semibold text-bts-primary truncate">
                    {event.rule.label ?? event.rule.ruleType.replace(/_/g, " ")}
                  </p>
                  <Pill variant={event.acknowledged ? "default" : severityPillVariant[event.rule.severity]}>
                    {event.rule.severity}
                  </Pill>
                </div>
                <p className="text-caption text-bts-tertiary">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
              {!event.acknowledged && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(event.id)}
                  className="text-caption text-bts-tertiary hover:text-bts-secondary transition-colors"
                >
                  Ack
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
