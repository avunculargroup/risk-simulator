-- ─────────────────────────────────────────────────────────────────────────────
-- BTC Treasury Risk Simulator — Supabase Post-Migration Setup
-- Run this in the Supabase SQL Editor AFTER running db:push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert price_history to a TimescaleDB hypertable
-- Must be done BEFORE inserting any data
SELECT create_hypertable('price_history', 'timestamp', if_not_exists => true);

-- Enable compression on price_history (compress after 7 days)
ALTER TABLE price_history SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'timestamp DESC'
);
SELECT add_compression_policy('price_history', INTERVAL '7 days', if_not_exists => true);

-- ─── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "users_own_row" ON users
  FOR ALL USING (id = auth.uid());

-- Preferences: own row only
CREATE POLICY "preferences_own" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Positions: own rows only
CREATE POLICY "positions_own" ON treasury_positions
  FOR ALL USING (user_id = auth.uid());

-- Lots: via position ownership
CREATE POLICY "lots_via_position" ON treasury_lots
  FOR ALL USING (
    position_id IN (
      SELECT id FROM treasury_positions WHERE user_id = auth.uid()
    )
  );

-- Simulation runs: own rows
CREATE POLICY "sim_runs_own" ON simulation_runs
  FOR ALL USING (user_id = auth.uid());

-- Simulation metrics/paths: via run ownership
CREATE POLICY "sim_metrics_via_run" ON simulation_metrics
  FOR ALL USING (
    run_id IN (SELECT id FROM simulation_runs WHERE user_id = auth.uid())
  );

CREATE POLICY "sim_paths_via_run" ON simulation_paths
  FOR ALL USING (
    run_id IN (SELECT id FROM simulation_runs WHERE user_id = auth.uid())
  );

-- Alert rules: own rows
CREATE POLICY "alert_rules_own" ON alert_rules
  FOR ALL USING (user_id = auth.uid());

-- Alert events: via rule ownership
CREATE POLICY "alert_events_via_rule" ON alert_events
  FOR SELECT USING (
    rule_id IN (SELECT id FROM alert_rules WHERE user_id = auth.uid())
  );
CREATE POLICY "alert_events_insert" ON alert_events
  FOR INSERT WITH CHECK (true); -- Inserted by worker (service role)

-- What-if scenarios: own rows
CREATE POLICY "what_if_own" ON what_if_scenarios
  FOR ALL USING (user_id = auth.uid());

-- Audit log: INSERT only for authenticated users (immutable)
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_log_select_own" ON audit_log
  FOR SELECT USING (user_id = auth.uid());
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;

-- ─── Supabase Realtime ────────────────────────────────────────────────────────

-- Enable REPLICA IDENTITY FULL so Realtime broadcasts full row data on UPDATE
ALTER TABLE simulation_runs REPLICA IDENTITY FULL;
ALTER TABLE alert_events REPLICA IDENTITY FULL;

-- Publish tables to Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE simulation_runs, alert_events;
COMMIT;

-- ─── Development Seed ─────────────────────────────────────────────────────────
-- Insert a seed BTC price for local development (optional)
INSERT INTO price_history (timestamp, close, source)
VALUES (NOW(), '67000.00', 'seed')
ON CONFLICT DO NOTHING;
