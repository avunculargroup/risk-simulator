import type { GARCHParams } from "./types";

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────

export function seedableRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Box-Muller normal samples ────────────────────────────────────────────────

export function boxMuller(rng: () => number): [number, number] {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

// ─── Student-t sample (df degrees of freedom) ────────────────────────────────
// Method: ratio of standard normal to sqrt(chi-squared/df)

export function sampleStudentT(df: number, rng: () => number): number {
  const [z] = boxMuller(rng);

  // Chi-squared via sum of squared normals (approximate for integer df)
  let chiSq = 0;
  const pairs = Math.floor(df / 2);
  for (let i = 0; i < pairs; i++) {
    const [a, b] = boxMuller(rng);
    chiSq += a * a + b * b;
  }
  if (df % 2 === 1) {
    const [a] = boxMuller(rng);
    chiSq += a * a;
  }

  return z / Math.sqrt(chiSq / df);
}

// ─── GARCH(1,1) fitting ───────────────────────────────────────────────────────

export function fitGARCH(returns: number[]): GARCHParams {
  const n = returns.length;
  if (n < 30) {
    // Insufficient data — return reasonable BTC defaults
    return {
      omega: 0.00001,
      alpha: 0.10,
      beta: 0.85,
      mu: 0.0002,
      initialVariance: 0.0010,
      df: 5,
    };
  }

  const mu = returns.reduce((s, r) => s + r, 0) / n;
  const demeaned = returns.map(r => r - mu);
  const variance = demeaned.reduce((s, r) => s + r * r, 0) / n;

  // Simple moment-matching for GARCH(1,1)
  // Target: unconditional variance = omega / (1 - alpha - beta)
  // Use typical BTC parameters as starting point and adjust to fit sample variance
  const alpha = 0.08;
  const beta = 0.87;
  const persistence = alpha + beta; // 0.95 — typical for BTC

  const omega = variance * (1 - persistence);

  return {
    omega: Math.max(omega, 1e-8),
    alpha,
    beta,
    mu,
    initialVariance: variance,
    df: 5, // Student-t degrees of freedom for fat tails
  };
}

// ─── GARCH(1,1) simulation ────────────────────────────────────────────────────

export function simulateGARCH(
  params: GARCHParams,
  steps: number,
  rng: () => number
): number[] {
  const { omega, alpha, beta, mu, initialVariance, df } = params;
  const returns: number[] = new Array(steps);
  let ht = initialVariance;
  let prevEps2 = initialVariance;

  for (let t = 0; t < steps; t++) {
    // Update variance: h_t = omega + alpha * eps_{t-1}^2 + beta * h_{t-1}
    ht = omega + alpha * prevEps2 + beta * ht;
    ht = Math.max(ht, 1e-8);

    const eps = sampleStudentT(df, rng);
    const ret = mu + Math.sqrt(ht) * eps;
    returns[t] = ret;
    prevEps2 = ret * ret;
  }

  return returns;
}

// ─── Cholesky decomposition ───────────────────────────────────────────────────

export function choleskyDecompose(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(matrix[i][i] - sum, 0));
      } else {
        L[i][j] = L[j][j] > 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
      }
    }
  }

  return L;
}

// ─── Correlated returns ───────────────────────────────────────────────────────

export function generateCorrelatedReturns(
  L: number[][], // Cholesky factor (lower triangular)
  innovations: number[][] // [series x steps] uncorrelated innovations
): number[][] {
  const n = L.length;
  const steps = innovations[0].length;
  const correlated: number[][] = Array.from({ length: n }, () => new Array(steps).fill(0));

  for (let t = 0; t < steps; t++) {
    for (let i = 0; i < n; i++) {
      let val = 0;
      for (let j = 0; j <= i; j++) {
        val += L[i][j] * innovations[j][t];
      }
      correlated[i][t] = val;
    }
  }

  return correlated;
}
