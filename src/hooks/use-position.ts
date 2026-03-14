"use client";

import { useState, useEffect, useCallback } from "react";

interface PositionMetrics {
  totalBtc: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

interface UsePositionReturn {
  position: unknown;
  lots: unknown[];
  metrics: PositionMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePosition(): UsePositionReturn {
  const [position, setPosition] = useState<unknown>(null);
  const [lots, setLots] = useState<unknown[]>([]);
  const [metrics, setMetrics] = useState<PositionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/position");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch position");
      setPosition(json.data.position);
      setLots(json.data.lots);
      setMetrics(json.data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  return { position, lots, metrics, isLoading, error, refetch: fetchPosition };
}
