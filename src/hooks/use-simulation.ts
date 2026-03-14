"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { PercentileBands } from "@/engine/types";

interface SimulationMetrics {
  var95: string;
  var99: string;
  cvar95: string;
  cvar99: string;
  maxDrawdown: string;
  expectedReturn: string;
  volatility: string;
  terminalPriceMedian: string;
  terminalPriceMean: string;
  probLoss: string;
}

interface SimulationData {
  run: {
    id: string;
    engine: string;
    status: string;
    createdAt: string;
  };
  metrics: SimulationMetrics | null;
  bands: PercentileBands | null;
}

interface UseSimulationReturn {
  data: SimulationData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSimulation(runId: string | null): UseSimulationReturn {
  const [data, setData] = useState<SimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulation = useCallback(async () => {
    if (!runId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/simulation/${runId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch simulation");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    fetchSimulation();

    // Subscribe to Supabase Realtime for status changes
    const channel = supabaseBrowser
      .channel(`sim-${runId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "simulation_runs",
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus === "completed" || newStatus === "failed") {
            fetchSimulation();
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [runId, fetchSimulation]);

  return { data, isLoading, error, refetch: fetchSimulation };
}
