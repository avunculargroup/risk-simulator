# BTC Treasury Risk Simulator

A professional-grade simulation platform for corporate Bitcoin treasury risk management. Built for risk analysts who need quantitative models — not a crypto trading app, not a portfolio tracker.

---

## What it does

The simulator lets a corporate treasury team model the risk profile of their Bitcoin holdings. Given a set of purchase lots, it runs forward-looking simulations and answers questions like:

- "What is the 95% Value at Risk on our 10.5 BTC position over the next 30 days?"
- "If we bought another 3 BTC at today's price, how would that change our tail risk?"
- "What happens to our portfolio under a 2018-style crash scenario?"

The output is a **fan chart** showing the spread of simulated future prices, a **loss distribution histogram**, key **risk metrics** (VaR, CVaR, max drawdown), and a plain-language **narrative summary** of what the numbers mean.

---

## Tech stack at a glance

| Concern | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components for initial data fetch, client components for interactivity |
| Database | Supabase (PostgreSQL 16 + TimescaleDB) | TimescaleDB for efficient time-series price storage; Supabase for Realtime subscriptions |
| ORM | Drizzle ORM | Type-safe queries; `prepare: false` required for pgBouncer (see below) |
| Queue | Redis + BullMQ | Simulations run in a separate worker process, not inside the API route |
| Auth | NextAuth.js v5 | Email/password credentials provider with JWT sessions |
| Charts | D3.js (fan chart) + Recharts (histogram) | D3 for precise SVG control; Recharts for simpler bar charts |
| Styling | Tailwind CSS + CSS custom properties | All colours are design tokens — never hard-coded hex values |

---

## Project structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── (auth)/             # Login and register pages
│   ├── dashboard/          # Main risk dashboard
│   ├── position/           # Lot management
│   ├── alerts/             # Alert rule configuration
│   └── api/                # REST API endpoints
│
├── engine/                 # Simulation engine — pure TypeScript, no React
│   ├── types.ts            # All shared types (start here when exploring)
│   ├── math.ts             # RNG, GARCH, Student-t, Cholesky
│   ├── risk-metrics.ts     # VaR, CVaR, drawdown, percentile bands
│   ├── monte-carlo.ts      # GARCH(1,1) + optional jump diffusion
│   ├── historical-replay.ts# Empirical replay of actual BTC history
│   ├── custom-stress-test.ts # Deterministic scenario shocks
│   ├── narrative.ts        # Generates the plain-language summary text
│   └── index.ts            # Orchestrator — the only entry point to the engine
│
├── db/
│   ├── schema.ts           # All 16 database tables (Drizzle schema)
│   ├── client.ts           # Database connection (singleton)
│   └── queries/            # One file per domain (positions, simulations, etc.)
│
├── workers/
│   ├── simulation-worker.ts  # BullMQ worker: runs simulations off the main thread
│   ├── price-ingestion.ts    # Polls CoinGecko every 60 seconds
│   ├── macro-ingestion.ts    # Fetches FRED macro data daily
│   └── alert-evaluator.ts   # Checks alert thresholds every 5 minutes
│
├── components/
│   ├── ui/                 # Primitive components (Input, Select, MetricCard, etc.)
│   ├── dashboard/          # Dashboard-specific components (FanChart, AlertPanel, etc.)
│   └── position/           # Position management components (LotTable, CsvImport, etc.)
│
├── hooks/                  # Client-side React hooks (data fetching + Realtime)
└── lib/                    # Auth config, Redis client, utility functions
```

---

## Getting started

### 1. Prerequisites

You need accounts and API keys for three external services before the app will run:

- **Supabase** (free tier works) — [supabase.com](https://supabase.com). You need a project with the **TimescaleDB extension enabled**.
- **Redis** — locally with `brew install redis && redis-server`, or a free instance from [Upstash](https://upstash.com).
- **CoinGecko** (optional) — free API at [coingecko.com/api](https://www.coingecko.com/en/api). Without an API key you get 10–30 requests/minute, which is enough for development.

### 2. Clone and install

```bash
git clone <repo-url>
cd risk-simulator
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because `eslint-config-next` requires ESLint 7/8 but the project uses ESLint 9.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`. The required values are:

```bash
# From your Supabase project dashboard → Settings → Database
# Transaction mode URL (port 6543) — used by the running app
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Session mode URL (port 5432) — used for migrations only
DIRECT_DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# From Supabase dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Keep this server-side only — never expose to the browser

# Redis — local default, or an Upstash URL
REDIS_URL=redis://localhost:6379

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Set up the database

Push the Drizzle schema to Supabase. This uses `DIRECT_DATABASE_URL` (session mode, port 5432):

```bash
npm run db:push
```

Then run the post-migration SQL in the **Supabase SQL Editor**. This enables TimescaleDB, converts the price table to a hypertable, and configures Row-Level Security and Realtime:

```
Supabase Dashboard → SQL Editor → New Query
→ paste the contents of scripts/supabase-setup.sql → Run
```

> **Important:** `scripts/supabase-setup.sql` must be run *before* any price data is inserted. TimescaleDB can only convert an empty table to a hypertable.

### 5. Seed development data

```bash
npm run db:seed
```

This creates:
- A demo user: `demo@treasury.local` / `password123`
- 5 BTC purchase lots representing a realistic corporate position
- 30 days of historical price data
- One sample alert rule

### 6. Start the app

You need **two terminal windows** — the Next.js dev server and the simulation worker are separate processes:

```bash
# Terminal 1: Next.js web server
npm run dev

# Terminal 2: Simulation worker (processes queued simulation jobs)
npm run dev:worker
```

Open [http://localhost:3000](http://localhost:3000) and log in with the demo credentials above.

---

## How a simulation flows end-to-end

Understanding this flow makes the codebase much easier to navigate.

```
1. User clicks "Run Simulation" on the dashboard
        ↓
2. POST /api/simulation/run
   - Validates params with Zod
   - Rate-checks (max 20/hour per user) via Redis
   - Creates a simulation_runs row in the DB (status: "pending")
   - Enqueues a BullMQ job with the run ID
   - Returns { runId } immediately (202 Accepted) — does NOT wait for results
        ↓
3. The dashboard subscribes to Supabase Realtime,
   watching for changes to that simulation_runs row
        ↓
4. src/workers/simulation-worker.ts picks up the job
   - Fetches position data and price history from the DB
   - Calls runSimulation() from src/engine/index.ts
   - The engine runs the selected simulation (e.g. Monte Carlo)
   - Results (metrics + percentile bands) are saved to the DB
   - simulation_runs status is updated to "completed"
        ↓
5. Supabase Realtime fires the UPDATE event to the browser
   - useSimulation() hook sees "completed"
   - Fetches GET /api/simulation/{id} for full results
   - Dashboard re-renders with the fan chart and metrics
```

The key architectural decision: **simulations never run inside an API route**. The API route just queues a job. This keeps the web process fast and allows simulations to run on separate infrastructure in production.

---

## The simulation engine

The engine lives in `src/engine/` and has zero dependencies on Next.js, React, or the DOM. This keeps it testable and portable.

### Monte Carlo (default)

Fits a **GARCH(1,1)** model to the last year of daily BTC log-returns, then simulates N price paths forward. Returns are drawn from a **Student-t distribution with 5 degrees of freedom** to capture the fat tails characteristic of crypto markets.

The GARCH model captures **volatility clustering** — periods of high volatility tend to persist. A pure Geometric Brownian Motion model would miss this.

Optionally, **Poisson jump diffusion** adds sudden price shocks drawn from a log-normal distribution with configurable intensity (default: ~3 jumps/year).

### Historical Replay

Takes every possible rolling window of N days from the actual price history and applies those return sequences to the current price. Produces an **empirical distribution** with no distributional assumptions. Requires at least 2× the horizon in days of price history.

### Custom Stress Test

Deterministic — no random sampling. Applies user-defined price shocks and computes portfolio impact. The worst case becomes your effective VaR.

### Adding a new engine

1. Create `src/engine/my-engine.ts` implementing `SimulationEngineInterface<MyParams>` from `types.ts`
2. Add `"my_engine"` to the `SimulationEngineType` union in `types.ts`
3. Add `"my_engine"` to the `simulationEngineEnum` in `src/db/schema.ts`, then run `npm run db:push`
4. Add the routing case in `src/engine/index.ts`
5. Add narrative templates in `narrative.ts`
6. Add UI controls in `src/components/dashboard/sim-params-panel.tsx`

---

## The design system

All visual styling flows from a two-layer token system.

### Layer 1: CSS custom properties (`src/app/globals.css`)

```css
:root {
  --color-bg: #FAFAF8;
  --color-gold: #C9A84C;
  --color-gain: #3D7A5E;   /* always green — does NOT change in dark mode */
  --color-loss: #B04040;   /* always red  — does NOT change in dark mode */
}

.dark {
  --color-bg: #0C0B09;
  --color-gold: #D4B35C;
  /* Semantic colours (gain, loss, warning, info) are intentionally absent here */
}
```

Dark mode is toggled by adding/removing the `.dark` class on `<html>`. It is **not** driven by the OS `prefers-color-scheme` media query — the user controls it via the sidebar toggle, and the preference is persisted to `localStorage`.

### Layer 2: Tailwind tokens (`tailwind.config`)

The CSS variables are exposed as Tailwind utility classes with the `bts-` prefix:

```tsx
// Correct — uses the design token
<div className="bg-bts-surface border border-bts-border text-bts-primary">

// Wrong — hard-coded value, breaks dark mode
<div style={{ background: '#FFFFFF' }}>
```

Key token reference:

| Token | Light | Dark | Use for |
|---|---|---|---|
| `bg-bts-bg` | `#FAFAF8` | `#0C0B09` | Page background |
| `bg-bts-surface` | `#FFFFFF` | `#171613` | Cards, panels |
| `bg-bts-surface-subtle` | `#F4F4F1` | `#1E1D19` | Alternate rows, subtle backgrounds |
| `border-bts-border` | `#E8E6E0` | `#2E2C26` | Most borders |
| `text-bts-primary` | `#1A1915` | `#E8E6E0` | Main text |
| `text-bts-secondary` | `#6B6860` | `#9E9C96` | Labels, metadata |
| `text-bts-tertiary` | `#9E9C96` | `#5C5A54` | Disabled, placeholder |
| `text-bts-gold` | `#C9A84C` | `#D4B35C` | Gold accent |
| `text-bts-gain` | `#3D7A5E` | (same) | Positive P&L |
| `text-bts-loss` | `#B04040` | (same) | Negative P&L, risk values |

### Typography rules

Three font roles — never mix them:

| Role | Tailwind class | Used for |
|---|---|---|
| Display | `font-display` | Page titles, section headers |
| UI / Body | `font-sans` | Labels, paragraph text, buttons |
| Data / Numbers | `font-mono` | All numerical values, prices, metrics |

```tsx
// Correct
<h1 className="font-display text-page-title">Risk Dashboard</h1>
<p className="font-sans text-body text-bts-secondary">30-day horizon</p>
<span className="font-mono text-data-lg">$1,234,567.89</span>
```

### Using colour values in D3 charts

D3 code runs in JavaScript and needs colour values as strings. Read them from the CSS variables rather than hard-coding:

```ts
const gold = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-gold').trim();
// Use `gold` in d3.attr('stroke', gold)
```

---

## Database schema overview

```
users
 └── treasury_positions (one per user initially)
      └── treasury_lots (each BTC purchase: amount, price, date)

simulation_runs (links to user + position)
 ├── simulation_metrics (VaR, CVaR, drawdown, etc.)
 └── simulation_paths (percentile bands for the fan chart)

price_history (TimescaleDB hypertable — indexed by timestamp)

alert_rules (links to user + position)
 └── alert_events (triggered alerts)

audit_log (append-only — INSERT only, no UPDATE or DELETE)
```

### Two database URLs — why they're different

| Variable | Port | Mode | Used for |
|---|---|---|---|
| `DATABASE_URL` | **6543** | Transaction (pgBouncer) | The running app |
| `DIRECT_DATABASE_URL` | **5432** | Session | Migrations only |

The runtime client uses `prepare: false`. This is **not optional** — PostgreSQL prepared statements are incompatible with pgBouncer in transaction mode. It works in development without it, but fails silently under load in production.

---

## API conventions

Every route follows the same four-step pattern:

```typescript
export async function POST(req: Request) {
  // 1. Auth check — always first
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Input validation with Zod — before touching the DB
  const parsed = mySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

  // 3. Business logic via query functions in src/db/queries/

  // 4. Audit log for every mutation
  await writeAuditLog({ userId: session.user.id, action: "...", resource: "..." });

  // 5. Consistent response shape — always
  return Response.json({ data: result });          // success
  return Response.json({ error: "..." }, { status: 500 }); // failure
}
```

All successful responses are `{ data: T }`. All error responses are `{ error: string }`. Never deviate from this.

---

## Workers

Workers are separate Node.js processes started with `tsx` (TypeScript execution without a compilation step). They share code with the web server (`src/engine/`, `src/db/`, `src/lib/`) but must **never import from `src/app/` or `src/components/`**.

```bash
# Simulation worker — must be running for simulations to complete
npm run dev:worker

# Other workers (run manually in development as needed)
npx tsx src/workers/price-ingestion.ts    # BTC price every 60s from CoinGecko
npx tsx src/workers/macro-ingestion.ts    # FRED macro data daily
npx tsx src/workers/alert-evaluator.ts    # Alert threshold checks every 5min
```

---

## Common tasks

### Inspect the database visually

```bash
npm run db:studio
# Opens Drizzle Studio at http://localhost:4983
```

### Add a column to a table

```bash
# 1. Edit src/db/schema.ts
# 2. Generate the migration file
npm run db:generate
# 3. Apply it to the database
npm run db:push
# 4. Update the relevant query file in src/db/queries/
```

### Check types before committing

```bash
npm run typecheck   # must pass with 0 errors
npm run lint
```

---

## Deployment

Designed for:

- **Vercel** — the Next.js web server
- **Railway** — the simulation worker process (`npm run worker:start`)

The worker only needs `DATABASE_URL` and `REDIS_URL`. The Supabase keys and `NEXTAUTH_SECRET` are only needed by the web server.

Production checklist:

1. Run `scripts/supabase-setup.sql` in the Supabase SQL editor for the production project
2. Set all environment variables in Vercel and Railway dashboards
3. Deploy the web server to Vercel (`npm run build` happens automatically)
4. Deploy the worker to Railway using the `worker:start` script
5. Set `NEXTAUTH_URL` to the production domain (e.g. `https://treasury.yourcompany.com`)

---

## Implementation roadmap

| Phase | Status | What's included |
|---|---|---|
| **Phase 1** | ✅ Complete | Auth, position management, Monte Carlo engine, historical replay, fan chart, VaR/CVaR metrics, alert scaffolding |
| **Phase 2** | Planned | BullMQ job progress bar, full loss distribution histogram, what-if scenario saving |
| **Phase 3** | Planned | FRED + Alpha Vantage macro data pipeline, macro-correlated engine, live alert delivery |
| **Phase 4** | Planned | PDF report export, mobile layout polish, Supabase Realtime hardening |

The `macro_correlated` engine stub in `src/engine/macro-correlated.ts` intentionally throws a "not yet implemented" error. This keeps the type system complete without shipping broken functionality.

---

## Key files to read first

If you're new to this codebase, read these five files in order:

1. **`src/engine/types.ts`** — All shared interfaces. Understand `SimulationParams`, `RiskMetrics`, `PositionSnapshot`, `PercentileBands`. Every other file depends on these shapes.

2. **`src/db/schema.ts`** — The complete data model. 16 tables with enums and foreign key relations. Understanding the schema gives you a mental map of how data flows through the system.

3. **`src/engine/index.ts`** — The simulation orchestrator. A short `switch` statement that routes to the correct engine. This is the only place the engine is called from outside `src/engine/`.

4. **`src/app/api/simulation/run/route.ts`** — How a simulation is triggered from the browser. Rate limiting, job enqueuing, and the immediate response pattern.

5. **`src/workers/simulation-worker.ts`** — How a simulation is executed. The data provider pattern (dependency injection) keeps the engine decoupled from the database.

---

## Contributing

Before opening a PR, confirm these:

- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes
- [ ] No hard-coded colour values (`#hex`, `rgb()`) in component files — use `bts-*` Tailwind classes
- [ ] No direct imports of engine files other than through `src/engine/index.ts` from outside the engine directory
- [ ] New API routes follow the auth → validate → query → audit → respond pattern
- [ ] Mutations write an entry to `audit_log` via `writeAuditLog()`
- [ ] New DB columns have a corresponding migration (`npm run db:generate` before `db:push`)
