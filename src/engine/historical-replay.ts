import type {
  SimulationEngineInterface,
  SimulationInput,
  SimulationOutput,
  HistoricalReplayParams,
} from "./types";
import { toLogReturns, fromLogReturns, timestampsForHorizon } from "./utils";
import { computeRiskMetrics, computePercentileBands, downsamplePaths } from "./risk-metrics";
import { generateNarrative } from "./narrative";

export class HistoricalReplay implements SimulationEngineInterface<HistoricalReplayParams> {
  async run(input: SimulationInput<HistoricalReplayParams>): Promise<SimulationOutput> {
    const { params, position, priceHistory } = input;
    const { horizon = 30 } = params;

    const closePrices = priceHistory.map(p => p.close);
    const logReturns = toLogReturns(closePrices);

    if (logReturns.length < horizon * 2) {
      throw new Error(
        `Insufficient price history for historical replay. Need at least ${horizon * 2} days, got ${logReturns.length}.`
      );
    }

    const currentPrice = position.currentPrice;
    const startDate = new Date();
    const timestamps = timestampsForHorizon(startDate, horizon);

    // Generate paths: each possible rolling window of length `horizon`
    const allPaths: number[][] = [];
    const terminalPrices: number[] = [];
    const windowCount = logReturns.length - horizon + 1;

    for (let start = 0; start < windowCount; start++) {
      const windowReturns = logReturns.slice(start, start + horizon);
      const path = fromLogReturns(currentPrice, windowReturns);
      allPaths.push(path);
      terminalPrices.push(path[path.length - 1]);
    }

    const downsampled = downsamplePaths(allPaths, Math.min(100, horizon + 1));
    const bands = computePercentileBands(allPaths, timestamps);

    const metrics = computeRiskMetrics(
      terminalPrices,
      currentPrice,
      allPaths,
      logReturns
    );

    const narrative = generateNarrative(metrics, params, position);

    return {
      metrics,
      bands,
      narrative,
      pathCount: allPaths.length,
    };
  }
}
