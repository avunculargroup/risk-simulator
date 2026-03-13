# BTC Treasury Risk Simulator

## Project Overview

A real-time simulation platform for corporate Bitcoin treasury risk management. Built with Next.js 14 (App Router), Drizzle ORM, Supabase (PostgreSQL + TimescaleDB), Redis/BullMQ, and Recharts.

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript strict mode)
- **Database**: Supabase PostgreSQL 16 + TimescaleDB extension
- **ORM**: Drizzle ORM (NOT Prisma — we need `prepare: false` for pgBouncer)
- **Cache/Queue**: Redis 7 + BullMQ for simulation job processing
- **Auth**: NextAuth.js v5 with credentials provider (email/password)
- **Charts**: Recharts (simple charts) + D3.js (custom fan charts, heatmaps)
- **Styling**: Tailwind CSS with CSS custom properties (see `DESIGN_BRIEF.md` for full design system)
- **Deployment**: Vercel (frontend) + Railway (worker process)

## Directory Structure

```
btc-treasury-risk/
├── CLAUDE.md                          # ← You are here
├── DESIGN_BRIEF.md                    # Visual design system, colours, typography, components
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── .env.local.example
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout (dark theme, fonts)
│   │   ├── page.tsx                   # Redirect to /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # Main risk dashboard
│   │   │   └── layout.tsx             # Dashboard shell (sidebar, topbar)
│   │   ├── position/
│   │   │   └── page.tsx               # Position management
│   │   ├── alerts/
│   │   │   └── page.tsx               # Alert rule configuration
│   │   └── api/
│   │       ├── simulation/
│   │       │   ├── run/route.ts       # POST: enqueue simulation job
│   │       │   ├── [id]/route.ts      # GET: fetch simulation results
│   │       │   └── history/route.ts   # GET: list past simulations
│   │       ├── position/
│   │       │   ├── route.ts           # GET/PUT: current position
│   │       │   ├── lots/route.ts      # GET/POST: manage lots
│   │       │   ├── lots/[id]/route.ts # PUT/DELETE: individual lot
│   │       │   ├── import/route.ts    # POST: CSV import
│   │       │   └── what-if/route.ts   # POST: create what-if scenario
│   │       ├── alerts/
│   │       │   ├── rules/route.ts     # GET/POST: alert rules
│   │       │   └── events/route.ts    # GET: alert event history
│   │       ├── price/
│   │       │   └── current/route.ts   # GET: latest BTC price
│   │       └── auth/
│   │           └── [...nextauth]/route.ts
│   │
│   ├── components/
│   │   ├── ui/                        # Shared UI primitives
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── pill.tsx
│   │   │   ├── metric-card.tsx
│   │   │   ├── bottom-sheet.tsx
│   │   │   └── section-header.tsx
│   │   ├── dashboard/
│   │   │   ├── engine-selector.tsx
│   │   │   ├── fan-chart.tsx
│   │   │   ├── loss-distribution.tsx
│   │   │   ├── macro-heatmap.tsx
│   │   │   ├── smart-summary.tsx
│   │   │   ├── alert-panel.tsx
│   │   │   ├── sim-params-panel.tsx
│   │   │   └── position-summary-card.tsx
│   │   └── position/
│   │       ├── lot-table.tsx
│   │       ├── add-lot-form.tsx
│   │       ├── csv-import.tsx
│   │       ├── what-if-panel.tsx
│   │       └── settings-panel.tsx
│   │
│   ├── engine/                        # Simulation engine (pure TypeScript, no React)
│   │   ├── index.ts                   # Orchestrator + re-exports
│   │   ├── types.ts                   # All type definitions
│   │   ├── math.ts                    # RNG, stats, GARCH fitting, correlation
│   │   ├── risk-metrics.ts            # VaR, CVaR, drawdown calculations
│   │   ├── monte-carlo.ts            # Monte Carlo engine (GARCH + jump diffusion)
│   │   ├── historical-replay.ts       # Historical scenario replay
│   │   ├── macro-correlated.ts        # Macro-correlated simulation
│   │   ├── custom-stress-test.ts      # Custom stress test engine
│   │   ├── narrative.ts              # Smart summary text generation
│   │   └── utils.ts                   # Timestamps, downsampling, percentile bands
│   │
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema (all tables, enums, relations)
│   │   ├── client.ts                  # Drizzle + Supabase client setup
│   │   └── queries/                   # Reusable query functions
│   │       ├── positions.ts
│   │       ├── simulations.ts
│   │       ├── prices.ts
│   │       ├── alerts.ts
│   │       └── audit.ts
│   │
│   ├── lib/
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── redis.ts                   # Redis client
│   │   └── utils.ts                   # General utilities
│   │
│   ├── hooks/
│   │   ├── use-breakpoint.ts          # Responsive breakpoint detection
│   │   ├── use-simulation.ts          # Simulation state + realtime updates
│   │   ├── use-position.ts            # Position data fetching
│   │   └── use-alerts.ts             # Alert subscription via Supabase Realtime
│   │
│   └── workers/
│       ├── simulation-worker.ts       # BullMQ worker entry point
│       ├── price-ingestion.ts         # CoinGecko/Binance price fetcher cron
│       ├── macro-ingestion.ts         # FRED/Alpha Vantage macro data cron
│       └── alert-evaluator.ts         # Threshold evaluation cron
│
├── drizzle/
│   └── migrations/                    # Generated by drizzle-kit
│
├── scripts/
│   ├── supabase-setup.sql             # Post-migration SQL (TimescaleDB, RLS, seeds)
│   └── seed.ts                        # Development seed data
│
└── public/
    └── ...
```

## Critical Conventions

### TypeScript

- Strict mode enabled. No `any` types except in clearly marked type assertions.
- All simulation engine code is pure TypeScript — no React, no DOM, no Node.js APIs. This keeps it testable and portable to worker threads.
- Use `interface` for object shapes, `type` for unions and intersections.

### Database

- ALL queries go through Drizzle ORM, never raw SQL in application code (raw SQL is fine in migration files and `supabase-setup.sql`).
- Use the `db` client from `src/db/client.ts` — never instantiate new connections.
- Session mode (port 5432) for migrations only. Transaction mode (port 6543) for runtime.
- `prepare: false` is required in the postgres client config for pgBouncer compatibility.

### API Routes

- All API routes validate input with zod schemas before processing.
- All mutation routes write to the audit_log table.
- Return consistent shapes: `{ data: T }` for success, `{ error: string }` for failure.
- Rate limit simulation runs: max 20/hour per user (enforced in middleware).

### Components

- Dashboard components receive data via props, not via internal fetch calls.
- Page-level components (`page.tsx`) are server components that fetch data and pass to client components.
- Client components are marked with `"use client"` and are in the `components/` directory.
- All chart components accept a `height` prop for responsive rendering.

### Simulation Engine

- Engine code in `src/engine/` must NEVER import from `src/components/`, `src/app/`, or `next/`.
- Engine code CAN import from `src/db/` (for the worker’s data provider functions).
- All engines implement `SimulationEngineInterface<P>` from `types.ts`.
- The orchestrator (`index.ts`) is the only entry point — never call engines directly from API routes.

### Styling

- **Read `DESIGN_BRIEF.md` before making ANY visual changes.** It is the single source of truth for colours, typography, spacing, and component design.
- All colours are CSS custom properties defined in `globals.css` and consumed via Tailwind’s `bts-*` token classes (e.g., `bg-bts-surface`, `text-bts-primary`, `border-bts-border`).
- **Never hard-code hex colour values in components.** Always use the `bts-*` Tailwind classes or `var(--color-*)` CSS custom properties.
- Light mode is the default. Dark mode is toggled via a `.dark` class on `<html>`, not system preference. Use Tailwind’s `dark:` prefix only for overrides that CSS variables don’t handle.
- Semantic colours (gain, loss, warning, info) are fixed across both modes — they do NOT change with the theme toggle.
- Typography: `font-display` for page/section headings, `font-sans` for all UI text, `font-mono` for all numerical data. Never mix these roles.
- For complex chart components that need precise pixel control, inline styles are acceptable — but still reference CSS custom properties for colours (`var(--color-gold)`, not `"#C9A84C"`).
- The logo SVG lives at `public/logo.svg`. See `DESIGN_BRIEF.md` → Logo Usage for placement rules.

## Key File Dependencies

```
API Route (POST /api/simulation/run)
  → validates params with zod
  → creates SimulationRun record in DB
  → enqueues job to BullMQ via enqueueSimulation()
  → returns { runId } immediately

Worker (simulation-worker.ts)
  → picks job from BullMQ queue
  → calls runSimulation() from engine/index.ts
  → runSimulation() fetches market data via data providers
  → routes to correct engine (monte-carlo, historical-replay, etc.)
  → engine returns SimulationOutput
  → worker stores results: metrics → PostgreSQL, paths → Supabase Storage
  → worker updates SimulationRun status to "completed"
  → Supabase Realtime broadcasts the status change

Dashboard (dashboard/page.tsx)
  → server component fetches latest simulation results + position
  → passes to client components as props
  → client subscribes to Supabase Realtime for live updates
  → when a new simulation completes, refetches and re-renders
```

## Environment Variables

```
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://...@pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REDIS_URL=redis://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
COINGECKO_API_KEY=...           # optional, increases rate limits
FRED_API_KEY=...                # for macro data (free at fred.stlouisfed.org)
ALPHA_VANTAGE_API_KEY=...       # for S&P 500, Gold, VIX data
```

## Build & Run Commands

```bash
# Development
npm run dev                      # Next.js dev server (port 3000)
npm run dev:worker               # Simulation worker (separate terminal)

# Database
npm run db:generate              # Generate Drizzle migration from schema changes
npm run db:push                  # Push schema to Supabase (uses DIRECT_DATABASE_URL)
npm run db:studio                # Open Drizzle Studio (DB browser)
npm run db:seed                  # Run seed script

# Production build
npm run build                    # Next.js production build
npm run start                    # Start production server
npm run worker:start             # Start worker in production

# Type checking & linting
npm run typecheck                # tsc --noEmit
npm run lint                     # eslint
```

## Implementation Priority

When building features, follow this order:

### Phase 1 (Foundation)

1. Project scaffolding (next.config, tsconfig, tailwind, package.json)
1. Database schema + Drizzle config + Supabase setup
1. Auth (NextAuth credentials provider)
1. Price data ingestion (CoinGecko cron)
1. Position management UI + API routes
1. Basic Monte Carlo engine (GBM only — skip GARCH for Phase 1)
1. Dashboard with fan chart + metric cards

### Phase 2 (Simulation Depth)

1. Upgrade Monte Carlo to GARCH + jump diffusion
1. BullMQ worker architecture
1. Historical replay engine
1. Full visualization suite (loss distribution, macro heatmap)
1. What-if position modeling

### Phase 3 (Intelligence)

1. Macro data pipeline (FRED + Alpha Vantage)
1. Macro-correlated engine
1. Custom stress test engine
1. Smart summary narrative generation
1. Alert system (rules, cron, notifications)

### Phase 4 (Polish)

1. PDF report export
1. Mobile responsive optimization
1. Supabase Realtime integration for live dashboard
1. Performance optimization
1. Onboarding flow

## Common Tasks for Claude Code

### “Add a new field to the position table”

1. Edit `src/db/schema.ts` — add column to `treasuryPositions`
1. Run `npm run db:generate` to create migration
1. Run `npm run db:push` to apply
1. Update `src/db/queries/positions.ts` if query shapes changed
1. Update relevant API routes and components

### “Add a new simulation engine”

1. Create `src/engine/my-engine.ts` implementing `SimulationEngineInterface<MyParams>`
1. Add param type to `SimulationParams` union in `types.ts`
1. Add engine enum value to `simulation_engine` in schema
1. Add routing case in `engine/index.ts` orchestrator
1. Add narrative template in `narrative.ts`
1. Add UI controls in `components/dashboard/sim-params-panel.tsx`

### “Add a new API route”

1. Create route file in `src/app/api/[resource]/route.ts`
1. Define zod input schema
1. Add auth check: `const session = await getServerSession(authOptions)`
1. Add audit log entry for mutations
1. Return consistent `{ data }` or `{ error }` shape

## Testing Strategy

- **Engine tests**: Pure unit tests (vitest). Test each engine with known inputs and verify VaR, CVaR, drawdown calculations against hand-computed values.
- **API tests**: Integration tests hitting real Supabase (test project). Verify auth, RLS, and response shapes.
- **Component tests**: Snapshot tests for chart components. Interaction tests for form components.
- **E2E**: Playwright for critical user flows (login → configure position → run simulation → view results).