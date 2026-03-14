import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const simulationEngineEnum = pgEnum("simulation_engine", [
  "monte_carlo",
  "historical_replay",
  "macro_correlated",
  "custom_stress_test",
]);

export const simulationStatusEnum = pgEnum("simulation_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

export const alertRuleTypeEnum = pgEnum("alert_rule_type", [
  "price_above",
  "price_below",
  "var_exceeds",
  "drawdown_exceeds",
  "portfolio_value_below",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  dashboardLayout: jsonb("dashboard_layout").$type<{
    theme: "light" | "dark";
    defaultEngine: string;
    defaultHorizon: number;
    defaultSimulations: number;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Treasury Positions & Lots ────────────────────────────────────────────────

export const treasuryPositions = pgTable("treasury_positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull().default("Primary Treasury"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index("treasury_positions_user_idx").on(t.userId),
}));

export const treasuryLots = pgTable("treasury_lots", {
  id: uuid("id").defaultRandom().primaryKey(),
  positionId: uuid("position_id")
    .notNull()
    .references(() => treasuryPositions.id, { onDelete: "cascade" }),
  btcAmount: numeric("btc_amount", { precision: 20, scale: 8 }).notNull(),
  purchasePrice: numeric("purchase_price", { precision: 20, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }).notNull(),
  label: varchar("label", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  positionIdx: index("treasury_lots_position_idx").on(t.positionId),
}));

// ─── Price History ────────────────────────────────────────────────────────────

export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  open: numeric("open", { precision: 20, scale: 2 }),
  high: numeric("high", { precision: 20, scale: 2 }),
  low: numeric("low", { precision: 20, scale: 2 }),
  close: numeric("close", { precision: 20, scale: 2 }).notNull(),
  volume: numeric("volume", { precision: 30, scale: 8 }),
  source: varchar("source", { length: 50 }).notNull().default("coingecko"),
}, (t) => ({
  timestampIdx: index("price_history_timestamp_idx").on(t.timestamp),
  uniqueTimestampSource: uniqueIndex("price_history_timestamp_source_unique").on(t.timestamp, t.source),
}));

// ─── Simulation Runs ──────────────────────────────────────────────────────────

export const simulationRuns = pgTable("simulation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  positionId: uuid("position_id")
    .references(() => treasuryPositions.id, { onDelete: "set null" }),
  engine: simulationEngineEnum("engine").notNull(),
  status: simulationStatusEnum("status").notNull().default("pending"),
  params: jsonb("params").notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index("simulation_runs_user_idx").on(t.userId),
  statusIdx: index("simulation_runs_status_idx").on(t.status),
}));

export const simulationMetrics = pgTable("simulation_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => simulationRuns.id, { onDelete: "cascade" })
    .unique(),
  var95: numeric("var_95", { precision: 20, scale: 4 }),
  var99: numeric("var_99", { precision: 20, scale: 4 }),
  cvar95: numeric("cvar_95", { precision: 20, scale: 4 }),
  cvar99: numeric("cvar_99", { precision: 20, scale: 4 }),
  maxDrawdown: numeric("max_drawdown", { precision: 10, scale: 6 }),
  expectedReturn: numeric("expected_return", { precision: 10, scale: 6 }),
  volatility: numeric("volatility", { precision: 10, scale: 6 }),
  terminalPriceMedian: numeric("terminal_price_median", { precision: 20, scale: 2 }),
  terminalPriceMean: numeric("terminal_price_mean", { precision: 20, scale: 2 }),
  probLoss: numeric("prob_loss", { precision: 10, scale: 6 }),
  pathCount: integer("path_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const simulationPaths = pgTable("simulation_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => simulationRuns.id, { onDelete: "cascade" })
    .unique(),
  bands: jsonb("bands").notNull(),
  timestamps: jsonb("timestamps").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Macro Data ───────────────────────────────────────────────────────────────

export const macroDataSeries = pgTable("macro_data_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticker: varchar("ticker", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const macroDataPoints = pgTable("macro_data_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  seriesId: uuid("series_id")
    .notNull()
    .references(() => macroDataSeries.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  value: numeric("value", { precision: 20, scale: 6 }).notNull(),
}, (t) => ({
  seriesTimestampIdx: index("macro_data_points_series_ts_idx").on(t.seriesId, t.timestamp),
}));

// ─── Alert Rules & Events ─────────────────────────────────────────────────────

export const alertRules = pgTable("alert_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  positionId: uuid("position_id")
    .references(() => treasuryPositions.id, { onDelete: "cascade" }),
  ruleType: alertRuleTypeEnum("rule_type").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("warning"),
  threshold: numeric("threshold", { precision: 20, scale: 6 }).notNull(),
  label: varchar("label", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index("alert_rules_user_idx").on(t.userId),
}));

export const alertEvents = pgTable("alert_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => alertRules.id, { onDelete: "cascade" }),
  triggeredValue: numeric("triggered_value", { precision: 20, scale: 6 }),
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ruleIdx: index("alert_events_rule_idx").on(t.ruleId),
  createdAtIdx: index("alert_events_created_at_idx").on(t.createdAt),
}));

// ─── What-If Scenarios ────────────────────────────────────────────────────────

export const whatIfScenarios = pgTable("what_if_scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  positionId: uuid("position_id")
    .references(() => treasuryPositions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  hypotheticalLots: jsonb("hypothetical_lots").notNull(),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: uuid("resource_id"),
  data: jsonb("data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index("audit_log_user_idx").on(t.userId),
  createdAtIdx: index("audit_log_created_at_idx").on(t.createdAt),
}));

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  positions: many(treasuryPositions),
  simulationRuns: many(simulationRuns),
  alertRules: many(alertRules),
  whatIfScenarios: many(whatIfScenarios),
  auditLogs: many(auditLog),
}));

export const treasuryPositionsRelations = relations(treasuryPositions, ({ one, many }) => ({
  user: one(users, { fields: [treasuryPositions.userId], references: [users.id] }),
  lots: many(treasuryLots),
  alertRules: many(alertRules),
  whatIfScenarios: many(whatIfScenarios),
}));

export const treasuryLotsRelations = relations(treasuryLots, ({ one }) => ({
  position: one(treasuryPositions, { fields: [treasuryLots.positionId], references: [treasuryPositions.id] }),
}));

export const simulationRunsRelations = relations(simulationRuns, ({ one }) => ({
  user: one(users, { fields: [simulationRuns.userId], references: [users.id] }),
  position: one(treasuryPositions, { fields: [simulationRuns.positionId], references: [treasuryPositions.id] }),
  metrics: one(simulationMetrics),
  paths: one(simulationPaths),
}));

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  user: one(users, { fields: [alertRules.userId], references: [users.id] }),
  position: one(treasuryPositions, { fields: [alertRules.positionId], references: [treasuryPositions.id] }),
  events: many(alertEvents),
}));

export const alertEventsRelations = relations(alertEvents, ({ one }) => ({
  rule: one(alertRules, { fields: [alertEvents.ruleId], references: [alertRules.id] }),
}));
