import { randomUUID } from "node:crypto";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export type TransactionKind = "income" | "expense";
export type ReportPeriod = "daily" | "weekly" | "monthly";
export type TrialStatus = "active" | "cancelled";

export const recurringExpenses = sqliteTable(
  "recurring_expenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    name: text("name").notNull(),
    amount_cents: integer("amount_cents").notNull(),
    category: text("category").notNull(),
    due_day: integer("due_day").notNull(),

    active: integer("active", { mode: "boolean" })
      .notNull()
      .default(true),

    notes: text("notes"),

    created_at: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updated_at: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("recurring_expenses_active_index").on(table.active),
  ],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    kind: text("kind")
      .$type<TransactionKind>()
      .notNull(),

    amount_cents: integer("amount_cents").notNull(),

    transaction_date: text("transaction_date").notNull(),

    category: text("category").notNull(),
    merchant: text("merchant"),
    description: text("description"),
    notes: text("notes"),

    recurring_expense_id: text("recurring_expense_id").references(
      () => recurringExpenses.id,
      { onDelete: "set null" },
    ),

    created_at: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updated_at: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("transactions_date_index").on(table.transaction_date),
    index("transactions_kind_date_index").on(
      table.kind,
      table.transaction_date,
    ),
    index("transactions_category_index").on(table.category),
  ],
);

export const recurringPayments = sqliteTable(
  "recurring_payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    recurring_expense_id: text("recurring_expense_id")
      .notNull()
      .references(() => recurringExpenses.id, {
        onDelete: "cascade",
      }),

    period_start: text("period_start").notNull(),
    paid_date: text("paid_date").notNull(),

    transaction_id: text("transaction_id")
      .notNull()
      .unique()
      .references(() => transactions.id, {
        onDelete: "cascade",
      }),

    created_at: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("recurring_payments_bill_period_unique").on(
      table.recurring_expense_id,
      table.period_start,
    ),
    index("recurring_payments_period_index").on(table.period_start),
  ],
);

export const aiReports = sqliteTable(
  "ai_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    period_type: text("period_type")
      .$type<ReportPeriod>()
      .notNull(),

    period_start: text("period_start").notNull(),
    period_end: text("period_end").notNull(),

    metrics: text("metrics", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    analysis: text("analysis", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    model: text("model").notNull(),

    generated_at: text("generated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("ai_reports_period_unique").on(
      table.period_type,
      table.period_start,
      table.period_end,
    ),
    index("ai_reports_period_index").on(
      table.period_type,
      table.period_start,
    ),
  ],
);

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),

  currency: text("currency").notNull().default("USD"),

  timezone: text("timezone")
    .notNull()
    .default("America/New_York"),

  monthly_budget_cents: integer("monthly_budget_cents"),

  starting_balance_cents: integer("starting_balance_cents")
    .notNull()
    .default(0),

  ai_analysis_enabled: integer("ai_analysis_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  daily_analysis_enabled: integer("daily_analysis_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  weekly_analysis_enabled: integer("weekly_analysis_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  monthly_analysis_enabled: integer("monthly_analysis_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const freeTrials = sqliteTable(
  "free_trials",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    service_name: text("service_name").notNull(),
    start_date: text("start_date").notNull(),
    duration_days: integer("duration_days").notNull(),
    charge_date: text("charge_date").notNull(),
    card_label: text("card_label").notNull(),
    notes: text("notes"),

    status: text("status")
      .$type<TrialStatus>()
      .notNull()
      .default("active"),

    remind_two_days: integer("remind_two_days", {
      mode: "boolean",
    })
      .notNull()
      .default(true),

    remind_one_day: integer("remind_one_day", {
      mode: "boolean",
    })
      .notNull()
      .default(true),

    created_at: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updated_at: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("free_trials_status_charge_index").on(
      table.status,
      table.charge_date,
    ),
  ],
);
