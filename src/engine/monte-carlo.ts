import type {
  SimulationEngineInterface,
  SimulationInput,
  SimulationOutput,
  MonteCarloParams,
} from "./types";
import { fitGARCH, simulateGARCH, seedableRng, boxMuller } from "./math";
import { toLogReturns, fromLogReturns, timestampsForHorizon } from "./utils";
import { computeRiskMetrics, computePercentileBands, downsamplePaths } from "./risk-metrics";
import { generateNarrative } from "./narrative";

export class MonteCarlo implements SimulationEngineInterface<MonteCarloParams> {
  async run(input: SimulationInput<MonteCarloParams>): Promise<SimulationOutput> {
    const { params, position, priceHistory } = input;
    const {
      horizon = 30,
      simulations = 1000,
      enableJumps = false,
      jumpIntensity = 3,
      jumpMeanSize = -0.05,
      jumpVolatility = 0.15,
      seed = Date.now(),
    } = params;

    const rng = seedableRng(seed);

    // Fit GARCH to historical data
    const closePrices = priceHistory.map(p => p.close);
    const logReturns = toLogReturns(closePrices);
    const garchParams = fitGARCH(logReturns);

    const currentPrice = position.currentPrice;
    const startDate = new Date();
    const timestamps = timestampsForHorizon(startDate, horizon);

    const allPaths: number[][] = [];
    const terminalPrices: number[] = [];

    // Run N simulations
    for (let sim = 0; sim < simulations; sim++) {
      const returns = simulateGARCH(garchParams, horizon, rng);

      // Add jump diffusion if enabled
      if (enableJumps) {
        const lambdaDaily = jumpIntensity / 252;
        for (let t = 0; t < horizon; t++) {
          // Poisson draw: approximate as Bernoulli for small lambda
          if (rng() < lambdaDaily) {
            const [z] = boxMuller(rng);
            const jumpSize = jumpMeanSize + jumpVolatility * z;
            returns[t] += jumpSize;
          }
        }
      }

      const path = fromLogReturns(currentPrice, returns);
      allPaths.push(path);
      terminalPrices.push(path[path.length - 1]);
    }

    // Downsample paths for efficient storage (keep 100 points)
    const downsampled = downsamplePaths(allPaths, Math.min(100, horizon + 1));

    // Compute percentile bands at each time step
    const bands = computePercentileBands(allPaths, timestamps);

    // Compute risk metrics
    const metrics = computeRiskMetrics(
      terminalPrices,
      currentPrice,
      allPaths,
      logReturns
    );

    // Generate narrative
    const narrative = generateNarrative(metrics, params, position);

    return {
      metrics,
      bands,
      narrative,
      pathCount: simulations,
    };
  }
}
