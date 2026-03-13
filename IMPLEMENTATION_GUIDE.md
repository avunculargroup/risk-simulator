# Implementation Guide: From Source Files to Working Project

## What You Have

From this conversation, you have these deliverables:

|File                                   |Purpose                                |Status                                       |
|---------------------------------------|---------------------------------------|---------------------------------------------|
|`btc-treasury-risk-simulator-spec.docx`|Full MVP specification (13 sections)   |Complete — reference doc                     |
|`schema.ts`                            |Drizzle ORM database schema (16 tables)|Production-ready — copy to `src/db/schema.ts`|
|`supabase-setup.sql`                   |TimescaleDB, RLS policies, seeds       |Production-ready — run in Supabase SQL Editor|
|`drizzle.config.ts`                    |Drizzle Kit configuration              |Production-ready                             |
|`db-client.ts`                         |Database + Supabase client module      |Production-ready — copy to `src/db/client.ts`|
|`engine/*.ts` (11 files)               |Full simulation engine                 |Production-ready — copy to `src/engine/`     |
|`dashboard-responsive.jsx`             |Dashboard prototype (all breakpoints)  |Prototype — needs decomposition              |
|`position-manager.jsx`                 |Position management prototype          |Prototype — needs decomposition              |
|`CLAUDE.md`                            |Master project instruction file        |Production-ready — project root              |
|`package.json`                         |Dependencies and scripts               |Production-ready                             |
|`tsconfig.json`                        |TypeScript config                      |Production-ready                             |
|`tailwind.config.ts`                   |Theme tokens                           |Production-ready                             |
|`.env.local.example`                   |Environment variable template          |Production-ready                             |
|`scripts/assemble.sh`                  |Project assembly script                |Utility — run once                           |

## How to Use These with Claude Code

### Step 1: Assemble the project

```bash
# Create project directory
mkdir btc-treasury-risk && cd btc-treasury-risk

# Run the assembly script (or manually copy files per CLAUDE.md structure)
bash scripts/assemble.sh /path/to/source/files .

# Install dependencies
npm install
```

### Step 2: Set up infrastructure

```bash
# 1. Create a Supabase project at supabase.com
# 2. Create a Redis instance (Railway, Upstash, or local)
# 3. Copy and fill in environment variables
cp .env.local.example .env.local
```

### Step 3: Initialize database

```bash
# Push Drizzle schema to Supabase
npm run db:push

# Then go to Supabase Dashboard → SQL Editor
# and run scripts/supabase-setup.sql
```

### Step 4: Open Claude Code and start building

The `CLAUDE.md` file is the key. Claude Code reads it automatically and will understand the entire project structure, conventions, and what needs to be built.

## What Claude Code Should Do First

Open Claude Code in the project root and give it these instructions:

### Prompt 1: Component Decomposition

```
The _dashboard-prototype.jsx and _position-prototype.jsx files in
src/app/ are monolithic prototypes. Decompose them into the component
structure defined in CLAUDE.md:

1. Extract shared UI primitives (Input, Select, Pill, MetricCard,
   BottomSheet, SectionHeader) into src/components/ui/ as proper
   TypeScript components with typed props.

2. Extract dashboard-specific components (EngineSelector, FanChart,
   LossDistribution, MacroHeatmap, SmartSummary, AlertPanel,
   SimParamsPanel) into src/components/dashboard/.

3. Extract position components (LotTable, AddLotForm, CsvImport,
   WhatIfPanel, SettingsPanel) into src/components/position/.

4. Convert all inline color constants to Tailwind classes using
   the risk-* tokens defined in tailwind.config.ts.

5. Convert the JSX prototypes to TypeScript (.tsx) with proper
   type annotations for all props.

6. Create the page-level server components (dashboard/page.tsx,
   position/page.tsx) that will eventually fetch data and pass
   to the client components.

Keep the mock data for now — we'll wire up real data in the next step.
```

### Prompt 2: API Routes

```
Create the API routes defined in CLAUDE.md:

1. POST /api/simulation/run — accepts simulation params (validate
   with zod), creates a SimulationRun record, enqueues a BullMQ job,
   returns { runId }.

2. GET /api/simulation/[id] — fetches simulation results including
   metrics and summary text.

3. GET/PUT /api/position — get or update the current treasury position.

4. GET/POST /api/position/lots — list lots or add a new lot.

5. POST /api/position/import — accept CSV data and create lots.

6. GET /api/price/current — return latest BTC price from cache/DB.

Each route should:
- Validate input with zod
- Check auth via getServerSession
- Write to audit_log for mutations
- Return { data: T } or { error: string }

Use the query functions from src/db/queries/ (create these files
with reusable Drizzle queries).
```

### Prompt 3: Wire Up Real Data

```
Replace the mock data in the dashboard and position components
with real data from the API:

1. Create custom hooks:
   - usePosition() — fetches position data, returns { position, lots, isLoading }
   - useSimulation(runId) — fetches simulation results + subscribes to
     Supabase Realtime for status updates
   - useAlerts() — fetches alert rules and subscribes to alert_events

2. Update dashboard/page.tsx (server component) to fetch:
   - Current position from the database
   - Latest simulation results
   - Active alerts
   - Current BTC price
   Then pass these as props to the client dashboard component.

3. Update position/page.tsx similarly.

4. The simulation engine worker.ts has stub functions (fetchPosition,
   fetchCurrentPrice, etc.) — implement these with real Drizzle queries.
```

### Prompt 4: Background Jobs

```
Set up the background job infrastructure:

1. Create src/lib/redis.ts — Redis client (ioredis) with connection
   config from REDIS_URL.

2. Create src/workers/price-ingestion.ts — a BullMQ repeatable job
   that fetches BTC/USD from CoinGecko API every 60 seconds and
   inserts into price_history. Also update Redis cache with latest price.

3. Create src/workers/alert-evaluator.ts — a BullMQ repeatable job
   that runs every 5 minutes, checks all active alert rules against
   current price/metrics, and creates alert_events when thresholds
   are breached.

4. Update src/workers/simulation-worker.ts to uncomment the real
   database queries (the Drizzle query shapes are documented in
   comments throughout the file).

5. Create a unified worker entry point that starts all workers:
   simulation queue, price ingestion cron, and alert evaluator cron.
```

## Architecture Decisions to Preserve

These decisions were made deliberately during the spec phase. Don’t let
Claude Code override them:

1. **Drizzle over Prisma** — We need `prepare: false` for Supabase
   pgBouncer. Drizzle also works better with TimescaleDB functions.
1. **GARCH + Jump Diffusion over plain GBM** — The whole point of the
   product is realistic tail-risk modeling. GBM is only a Phase 1
   stepping stone.
1. **BullMQ workers as separate processes** — Simulations must not
   block the Next.js request cycle. The worker runs as a separate
   container.
1. **Supabase Realtime over custom WebSockets** — Less infrastructure
   to manage. Enable on alert_events and simulation_runs tables.
1. **Template-based narratives over LLM-generated** — The smart
   summary uses deterministic templates, not AI generation. This is
   intentional: risk reports need reproducibility and auditability.
1. **Student-t innovations in Monte Carlo** — The engine uses
   student-t(df=5) random variables, not Gaussian. BTC’s excess
   kurtosis makes Gaussian VaR dangerously optimistic.
1. **Row-Level Security** — Even if API-level auth has a bug, RLS
   ensures cross-org data isolation. Don’t bypass it.

## File Modification Guide

When Claude Code needs to modify files, here’s how the dependencies flow:

```
schema.ts changes
  → run db:generate + db:push
  → update src/db/queries/*.ts
  → update API routes that use those queries
  → update components that display the data

engine/*.ts changes
  → update types.ts first
  → update the specific engine file
  → update index.ts orchestrator if new routing needed
  → update narrative.ts if new engine/metrics
  → update sim-params-panel.tsx for new UI controls

New API route
  → create route file
  → create/update db query function
  → create zod schema for input validation
  → add audit log write for mutations
  → update relevant page component to call the API

New UI component
  → create in src/components/{section}/
  → add TypeScript props interface
  → use Tailwind risk-* tokens (not inline colors)
  → if it needs data, receive via props (not internal fetch)
```