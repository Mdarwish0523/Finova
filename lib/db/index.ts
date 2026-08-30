import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

import * as schema from "./schema";

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "finova.db");
const sqlite = new BetterSqlite3(databasePath);

sqlite.pragma("busy_timeout = 10000");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS recurring_expenses (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    category TEXT NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    transaction_date TEXT NOT NULL,
    category TEXT NOT NULL,
    merchant TEXT,
    description TEXT,
    notes TEXT,
    recurring_expense_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recurring_expense_id)
      REFERENCES recurring_expenses(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS recurring_payments (
    id TEXT PRIMARY KEY NOT NULL,
    recurring_expense_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    paid_date TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recurring_expense_id)
      REFERENCES recurring_expenses(id)
      ON DELETE CASCADE,
    FOREIGN KEY (transaction_id)
      REFERENCES transactions(id)
      ON DELETE CASCADE,
    UNIQUE (recurring_expense_id, period_start)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
    currency TEXT NOT NULL DEFAULT 'USD',
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    monthly_budget_cents INTEGER,
    starting_balance_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS free_trials (
    id TEXT PRIMARY KEY NOT NULL,
    service_name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    charge_date TEXT NOT NULL,
    card_label TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'cancelled')),
    remind_two_days INTEGER NOT NULL DEFAULT 1,
    remind_one_day INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS transactions_date_index
    ON transactions(transaction_date DESC);

  CREATE INDEX IF NOT EXISTS transactions_kind_date_index
    ON transactions(kind, transaction_date DESC);

  CREATE INDEX IF NOT EXISTS transactions_category_index
    ON transactions(category);

  CREATE INDEX IF NOT EXISTS recurring_expenses_active_index
    ON recurring_expenses(active);

  CREATE INDEX IF NOT EXISTS recurring_payments_period_index
    ON recurring_payments(period_start DESC);

  CREATE INDEX IF NOT EXISTS free_trials_status_charge_index
    ON free_trials(status, charge_date);

  INSERT OR IGNORE INTO settings (id)
  VALUES (1);
`);

export const db = drizzle(sqlite, { schema });

export { sqlite };
