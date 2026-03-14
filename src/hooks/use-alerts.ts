"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export interface AlertEvent {
  id: string;
  ruleId: string;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  triggeredValue: string | null;
  createdAt: Date;
  rule: {
    id: string;
    userId: string;
    positionId: string | null;
    label: string | null;
    ruleType: string;
    severity: string;
    threshold: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface UseAlertsReturn {
  events: AlertEvent[];
  isLoading: boolean;
  error: string | null;
  acknowledge: (eventId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts/events?limit=20");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch alerts");
      setEvents(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // Subscribe to new alert events via Supabase Realtime
    const channel = supabaseBrowser
      .channel("alert-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alert_events" },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [fetchEvents]);

  const acknowledge = async (eventId: string) => {
    try {
      await fetch("/api/alerts/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      setEvents(prev =>
        prev.map(e => e.id === eventId ? { ...e, acknowledged: true } : e)
      );
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  return { events, isLoading, error, acknowledge, refetch: fetchEvents };
}
