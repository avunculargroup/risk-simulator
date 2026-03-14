// ─── Primitive types ──────────────────────────────────────────────────────────

export interface PricePoint {
  timestamp: Date;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface MacroDataPoint {
  timestamp: Date;
  value: number;
}

export interface MacroSeries {
  ticker: string;
  name: string;
  points: MacroDataPoint[];
}

export interface MacroSnapshot {
  series: MacroSeries[];
  correlations: Record<string, number>; // ticker -> btc correlation
}

// ─── Position types ───────────────────────────────────────────────────────────

export interface LotSnapshot {
  id: string;
  btcAmount: number;
  purchasePrice: number;
  purchaseDate: Date;
  label?: string;
}

export interface PositionSnapshot {
  id: string;
  userId: string;
  name: string;
  lots: LotSnapshot[];
  totalBtc: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

// ─── Simulation params ────────────────────────────────────────────────────────

export type SimulationEngineType =
  | "monte_carlo"
  | "historical_replay"
  | "macro_correlated"
  | "custom_stress_test";

export interface MonteCarloParams {
  engine: "monte_carlo";
  horizon: number;        // days
  simulations: number;    // number of paths
  confidenceLevel?: number; // default 0.95
  enableJumps?: boolean;
  jumpIntensity?: number; // jumps per year (lambda)
  jumpMeanSize?: number;  // mean log jump size
  jumpVolatility?: number; // std dev of log jump size
  seed?: number;
}

export interface HistoricalReplayParams {
  engine: "historical_replay";
  horizon: number;        // days
  minHistoryYears?: number; // minimum years of history required (default 3)
}

export interface MacroCorrelatedParams {
  engine: "macro_correlated";
  horizon: number;
  simulations: number;
  macroTickers: string[]; // e.g., ["DXY", "SPX", "VIX"]
}

export interface StressScenario {
  name: string;
  priceMovePct: number;  // e.g., -0.50 for -50%
  timeHorizonDays: number;
}

export interface CustomStressTestParams {
  engine: "custom_stress_test";
  scenarios: StressScenario[];
}

export type SimulationParams =
  | MonteCarloParams
  | HistoricalReplayParams
  | MacroCorrelatedParams
  | CustomStressTestParams;

// ─── Simulation input/output ──────────────────────────────────────────────────

export interface SimulationInput<P extends SimulationParams> {
  params: P;
  position: PositionSnapshot;
  priceHistory: PricePoint[];
  macroData?: MacroSnapshot;
}

export interface RiskMetrics {
  var95: number;         // 95% Value at Risk (dollar loss)
  var99: number;         // 99% VaR
  cvar95: number;        // 95% Conditional VaR (Expected Shortfall)
  cvar99: number;        // 99% CVaR
  maxDrawdown: number;   // worst peak-to-trough ratio across all paths
  expectedReturn: number; // mean terminal return
  volatility: number;    // annualised volatility estimate
  terminalPriceMedian: number;
  terminalPriceMean: number;
  probLoss: number;      // probability of net loss
}

export interface PercentileBands {
  timestamps: number[];  // unix ms
  p1: number[];
  p5: number[];
  p10: number[];
  p25: number[];
  p50: number[];         // median
  p75: number[];
  p90: number[];
  p95: number[];
  p99: number[];
}

export interface NarrativeSegment {
  type: "text" | "number" | "regime" | "warning";
  content: string;
  colorHint?: "gain" | "loss" | "warning" | "gold";
}

export interface NarrativeParagraph {
  segments: NarrativeSegment[];
}

export interface NarrativeOutput {
  headline: string;
  paragraphs: NarrativeParagraph[];
  keyInsights: string[];
}

export interface SimulationOutput {
  metrics: RiskMetrics;
  bands: PercentileBands;
  narrative: NarrativeOutput;
  pathCount: number;
}

// ─── Data providers interface ─────────────────────────────────────────────────

export interface DataProviders {
  fetchPosition(userId: string): Promise<PositionSnapshot>;
  fetchPriceHistory(days: number): Promise<PricePoint[]>;
  fetchMacroData?(tickers: string[]): Promise<MacroSnapshot>;
}

// ─── Engine interface ─────────────────────────────────────────────────────────

export interface SimulationEngineInterface<P extends SimulationParams> {
  run(input: SimulationInput<P>): Promise<SimulationOutput>;
}

// ─── GARCH types ──────────────────────────────────────────────────────────────

export interface GARCHParams {
  omega: number;
  alpha: number;
  beta: number;
  mu: number;
  initialVariance: number;
  df: number; // Student-t degrees of freedom
}
