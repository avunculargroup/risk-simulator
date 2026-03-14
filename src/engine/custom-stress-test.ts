import type {
  SimulationEngineInterface,
  SimulationInput,
  SimulationOutput,
  CustomStressTestParams,
  RiskMetrics,
  PercentileBands,
} from "./types";
import { generateNarrative } from "./narrative";

export class CustomStressTest implements SimulationEngineInterface<CustomStressTestParams> {
  async run(input: SimulationInput<CustomStressTestParams>): Promise<SimulationOutput> {
    const { params, position } = input;
    const { scenarios } = params;
    const currentPrice = position.currentPrice;

    // Build per-scenario paths and compute stressed prices
    const terminalPrices: number[] = [];
    const allPaths: number[][] = [];

    for (const scenario of scenarios) {
      const endPrice = currentPrice * (1 + scenario.priceMovePct);
      terminalPrices.push(endPrice);

      // Simple linear interpolation path
      const steps = scenario.timeHorizonDays + 1;
      const path: number[] = [];
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        path.push(currentPrice + (endPrice - currentPrice) * t);
      }
      allPaths.push(path);
    }

    // For stress tests, VaR is the worst-case scenario outcome
    const pnls = terminalPrices.map(p => (p - currentPrice) * position.totalBtc);
    const sorted = [...pnls].sort((a, b) => a - b);

    const var95 = sorted[0] ?? 0; // worst case
    const var99 = sorted[0] ?? 0;
    const cvar95 = sorted.reduce((s, v) => s + v, 0) / sorted.length;

    const metrics: RiskMetrics = {
      var95,
      var99,
      cvar95,
      cvar99: cvar95,
      maxDrawdown: scenarios.length > 0
        ? Math.max(...scenarios.map(s => Math.max(0, -s.priceMovePct)))
        : 0,
      expectedReturn: pnls.reduce((s, v) => s + v, 0) / (pnls.length || 1) / (currentPrice * position.totalBtc),
      volatility: 0, // Not applicable for deterministic stress tests
      terminalPriceMedian: terminalPrices[Math.floor(terminalPrices.length / 2)] ?? currentPrice,
      terminalPriceMean: terminalPrices.reduce((s, v) => s + v, 0) / (terminalPrices.length || 1),
      probLoss: terminalPrices.filter(p => p < currentPrice).length / (terminalPrices.length || 1),
    };

    // Build simplified bands from the range of scenarios
    const maxHorizon = Math.max(...scenarios.map(s => s.timeHorizonDays), 1);
    const timestamps: number[] = [];
    const now = Date.now();
    for (let i = 0; i <= maxHorizon; i++) {
      timestamps.push(now + i * 86400000);
    }

    const priceRange = terminalPrices.sort((a, b) => a - b);
    const bands: PercentileBands = {
      timestamps,
      p1: new Array(timestamps.length).fill(priceRange[0] ?? currentPrice),
      p5: new Array(timestamps.length).fill(priceRange[0] ?? currentPrice),
      p10: new Array(timestamps.length).fill(priceRange[0] ?? currentPrice),
      p25: new Array(timestamps.length).fill(priceRange[0] ?? currentPrice),
      p50: new Array(timestamps.length).fill(currentPrice),
      p75: new Array(timestamps.length).fill(priceRange[priceRange.length - 1] ?? currentPrice),
      p90: new Array(timestamps.length).fill(priceRange[priceRange.length - 1] ?? currentPrice),
      p95: new Array(timestamps.length).fill(priceRange[priceRange.length - 1] ?? currentPrice),
      p99: new Array(timestamps.length).fill(priceRange[priceRange.length - 1] ?? currentPrice),
    };

    const narrative = generateNarrative(metrics, params, position);

    return {
      metrics,
      bands,
      narrative,
      pathCount: scenarios.length,
    };
  }
}
