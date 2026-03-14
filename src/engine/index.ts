import type { SimulationParams, SimulationOutput, DataProviders } from "./types";
import { MonteCarlo } from "./monte-carlo";
import { HistoricalReplay } from "./historical-replay";
import { MacroCorrelated } from "./macro-correlated";
import { CustomStressTest } from "./custom-stress-test";

export async function runSimulation(
  userId: string,
  params: SimulationParams,
  providers: DataProviders
): Promise<SimulationOutput> {
  const [position, priceHistory] = await Promise.all([
    providers.fetchPosition(userId),
    providers.fetchPriceHistory(
      params.engine === "historical_replay"
        ? 365 * 3  // 3 years for historical replay
        : 365      // 1 year for GARCH fitting
    ),
  ]);

  const macroData = params.engine === "macro_correlated" && providers.fetchMacroData
    ? await providers.fetchMacroData(params.macroTickers)
    : undefined;

  const input = { params, position, priceHistory, macroData };

  switch (params.engine) {
    case "monte_carlo":
      return new MonteCarlo().run({ ...input, params });
    case "historical_replay":
      return new HistoricalReplay().run({ ...input, params });
    case "macro_correlated":
      return new MacroCorrelated().run({ ...input, params });
    case "custom_stress_test":
      return new CustomStressTest().run({ ...input, params });
    default:
      throw new Error(`Unknown simulation engine: ${(params as { engine: string }).engine}`);
  }
}

// Re-export types for consumers
export type { SimulationOutput, RiskMetrics, PercentileBands, NarrativeOutput } from "./types";
