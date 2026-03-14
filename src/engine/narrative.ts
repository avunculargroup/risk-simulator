import type {
  RiskMetrics,
  SimulationParams,
  PositionSnapshot,
  NarrativeOutput,
  NarrativeParagraph,
  NarrativeSegment,
} from "./types";

function text(content: string): NarrativeSegment {
  return { type: "text", content };
}

function num(content: string, colorHint?: "gain" | "loss" | "warning" | "gold"): NarrativeSegment {
  return { type: "number", content, colorHint };
}

function regime(content: string): NarrativeSegment {
  return { type: "regime", content };
}

function para(...segments: NarrativeSegment[]): NarrativeParagraph {
  return { segments };
}

function fmtUSD(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function fmtPct(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${(val * 100).toFixed(1)}%`;
}

export function generateNarrative(
  metrics: RiskMetrics,
  params: SimulationParams,
  position: PositionSnapshot
): NarrativeOutput {
  const horizon = "horizon" in params ? params.horizon : 30;
  const isHighRisk = metrics.probLoss > 0.45;
  const isModerateRisk = metrics.probLoss > 0.30;
  const isBullish = metrics.expectedReturn > 0.05;

  // Headline
  let headline: string;
  if (isHighRisk) {
    headline = `Elevated downside risk over ${horizon}-day horizon`;
  } else if (isBullish && !isModerateRisk) {
    headline = `Positive expected return with manageable tail risk`;
  } else {
    headline = `Moderate risk profile over ${horizon}-day simulation`;
  }

  const paragraphs: NarrativeParagraph[] = [];

  // Risk overview paragraph
  paragraphs.push(para(
    text("Over the "),
    num(`${horizon}-day`, "gold"),
    text(" simulation horizon, the model estimates a "),
    num(fmtPct(metrics.probLoss), metrics.probLoss > 0.4 ? "loss" : "warning"),
    text(" probability of loss. The 95% Value at Risk is "),
    num(fmtUSD(Math.abs(metrics.var95)), "loss"),
    text(", meaning in the worst 5% of outcomes, losses exceed this threshold."),
  ));

  // Expected outcome paragraph
  const posValue = position.currentValue;
  paragraphs.push(para(
    text("The median projected portfolio value at the end of the horizon is "),
    num(fmtUSD(metrics.terminalPriceMedian * position.totalBtc), isBullish ? "gain" : "warning"),
    text(` (vs current value of `),
    num(fmtUSD(posValue), "gold"),
    text("). Expected return is "),
    num(fmtPct(metrics.expectedReturn), metrics.expectedReturn >= 0 ? "gain" : "loss"),
    text("."),
  ));

  // Tail risk paragraph
  paragraphs.push(para(
    text("Conditional Expected Shortfall (CVaR 95%) — the average loss when VaR is breached — is "),
    num(fmtUSD(Math.abs(metrics.cvar95)), "loss"),
    text(". Maximum simulated drawdown across all paths is "),
    num(fmtPct(-metrics.maxDrawdown), "loss"),
    text("."),
  ));

  // Volatility context
  const annVol = metrics.volatility;
  let volRegime: string;
  if (annVol > 1.2) volRegime = "extreme";
  else if (annVol > 0.80) volRegime = "very high";
  else if (annVol > 0.60) volRegime = "high";
  else if (annVol > 0.40) volRegime = "moderate";
  else volRegime = "low";

  if (annVol > 0) {
    paragraphs.push(para(
      text("Annualised volatility is estimated at "),
      num(fmtPct(annVol), "warning"),
      text(", placing BTC in a "),
      regime(volRegime),
      text(" volatility regime. "),
      text(isHighRisk
        ? "Consider reviewing position sizing or hedging strategies."
        : "Current risk levels are within typical operating parameters."),
    ));
  }

  // Key insights
  const keyInsights: string[] = [];
  if (metrics.var95 < -posValue * 0.20) {
    keyInsights.push("VaR exceeds 20% of portfolio value — significant tail exposure");
  }
  if (metrics.maxDrawdown > 0.50) {
    keyInsights.push("Simulated max drawdown exceeds 50% — consider stop-loss planning");
  }
  if (metrics.probLoss < 0.25) {
    keyInsights.push("Less than 25% probability of loss in this scenario");
  }
  if (metrics.expectedReturn > 0.10) {
    keyInsights.push(`Expected return of ${fmtPct(metrics.expectedReturn)} over the horizon`);
  }

  return { headline, paragraphs, keyInsights };
}
