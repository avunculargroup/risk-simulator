import type { RiskMetrics, PercentileBands } from "./types";
import { percentile, mean, stddev, sortAscending, annualizedVolatility } from "./utils";

export function computeVaR(returns: number[], confidence: number): number {
  const sorted = sortAscending(returns);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return sorted[Math.max(0, idx)];
}

export function computeCVaR(returns: number[], confidence: number): number {
  const varValue = computeVaR(returns, confidence);
  const tailReturns = returns.filter(r => r <= varValue);
  if (tailReturns.length === 0) return varValue;
  return mean(tailReturns);
}

export function computeMaxDrawdown(path: number[]): number {
  let peak = path[0];
  let maxDD = 0;
  for (const price of path) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function computePercentileBands(
  paths: number[][],  // [pathIndex][timeStep]
  timestamps: Date[]
): PercentileBands {
  const steps = timestamps.length;
  const ps = [1, 5, 10, 25, 50, 75, 90, 95, 99];
  const bands: Record<string, number[]> = {};
  for (const p of ps) {
    bands[`p${p}`] = new Array(steps);
  }

  for (let t = 0; t < steps; t++) {
    const slice = paths.map(path => path[t]);
    const sorted = sortAscending(slice);
    for (const p of ps) {
      bands[`p${p}`][t] = percentile(sorted, p);
    }
  }

  return {
    timestamps: timestamps.map(d => d.getTime()),
    p1: bands["p1"],
    p5: bands["p5"],
    p10: bands["p10"],
    p25: bands["p25"],
    p50: bands["p50"],
    p75: bands["p75"],
    p90: bands["p90"],
    p95: bands["p95"],
    p99: bands["p99"],
  };
}

export function downsamplePaths(paths: number[][], targetPoints: number): number[][] {
  const steps = paths[0]?.length ?? 0;
  if (steps <= targetPoints) return paths;

  return paths.map(path => {
    const downsampled: number[] = [path[0]];
    const stride = (steps - 1) / (targetPoints - 1);
    for (let i = 1; i < targetPoints - 1; i++) {
      const idx = Math.round(i * stride);
      downsampled.push(path[idx]);
    }
    downsampled.push(path[steps - 1]);
    return downsampled;
  });
}

export function computeRiskMetrics(
  terminalPrices: number[],
  currentPrice: number,
  allPaths: number[][],
  dailyReturnHistory: number[]
): RiskMetrics {
  const terminalReturns = terminalPrices.map(p => (p - currentPrice) / currentPrice);
  const sorted = sortAscending(terminalReturns);

  const var95 = computeVaR(sorted, 0.95) * currentPrice;
  const var99 = computeVaR(sorted, 0.99) * currentPrice;
  const cvar95 = computeCVaR(sorted, 0.95) * currentPrice;
  const cvar99 = computeCVaR(sorted, 0.99) * currentPrice;

  // Max drawdown across all paths
  const maxDrawdown = Math.max(...allPaths.map(p => computeMaxDrawdown(p)));

  const probLoss = terminalReturns.filter(r => r < 0).length / terminalReturns.length;

  const terminalPricesSorted = sortAscending(terminalPrices);
  const terminalPriceMedian = percentile(terminalPricesSorted, 50);
  const terminalPriceMean = mean(terminalPrices);

  const vol = dailyReturnHistory.length >= 10
    ? annualizedVolatility(dailyReturnHistory)
    : stddev(terminalReturns);

  const expectedReturn = mean(terminalReturns);

  return {
    var95,
    var99,
    cvar95,
    cvar99,
    maxDrawdown,
    expectedReturn,
    volatility: vol,
    terminalPriceMedian,
    terminalPriceMean,
    probLoss,
  };
}
