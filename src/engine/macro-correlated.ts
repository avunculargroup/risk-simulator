import type {
  SimulationEngineInterface,
  SimulationInput,
  SimulationOutput,
  MacroCorrelatedParams,
} from "./types";
import { generateNarrative } from "./narrative";

export class MacroCorrelated implements SimulationEngineInterface<MacroCorrelatedParams> {
  async run(_input: SimulationInput<MacroCorrelatedParams>): Promise<SimulationOutput> {
    throw new Error(
      "MacroCorrelated engine is not yet implemented. This is a Phase 3 feature."
    );
  }
}
