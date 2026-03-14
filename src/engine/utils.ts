// Pure utility functions shared across engine files

export function toLogReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  return returns;
}

export function fromLogReturns(startPrice: number, returns: number[]): number[] {
  const prices: number[] = [startPrice];
  for (const r of returns) {
    prices.push(prices[prices.length - 1] * Math.exp(r));
  }
  return prices;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function timestampsForHorizon(startDate: Date, days: number): Date[] {
  const timestamps: Date[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    timestamps.push(d);
  }
  return timestamps;
}

export function sortAscending(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

export function annualizedVolatility(dailyReturns: number[]): number {
  return stddev(dailyReturns) * Math.sqrt(252);
}
