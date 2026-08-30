create type public.transaction_kind as enum (
  'income',
  'expense'
);

create type public.report_period as enum (
  'daily',
  'weekly',
  'monthly'
);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount_cents bigint not null check (amount_cents > 0),
  category text not null,
  due_day smallint not null check (due_day between 1 and 31),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.transaction_kind not null,
  amount_cents bigint not null check (amount_cents > 0),
  transaction_date date not null default current_date,
  category text not null,
  merchant text,
  description text,
  notes text,
  recurring_expense_id uuid references public.recurring_expenses(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type public.report_period not null,
  period_start date not null,
  period_end date not null,
  metrics jsonb not null default '{}'::jsonb,
  analysis jsonb not null default '{}'::jsonb,
  model text not null,
  generated_at timestamptz not null default now(),

  constraint ai_reports_valid_period
    check (period_end >= period_start),

  constraint ai_reports_unique_period
    unique (user_id, period_type, period_start, period_end)
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  timezone text not null default 'America/New_York',
  monthly_budget_cents bigint
    check (
      monthly_budget_cents is null
      or monthly_budget_cents >= 0
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date_index
  on public.transactions (user_id, transaction_date desc);

create index transactions_user_kind_date_index
  on public.transactions (user_id, kind, transaction_date desc);

create index transactions_user_category_index
  on public.transactions (user_id, category);

create index recurring_expenses_user_active_index
  on public.recurring_expenses (user_id, active);

create index ai_reports_user_period_index
  on public.ai_reports (
    user_id,
    period_type,
    period_start desc
  );

alter table public.transactions enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.ai_reports enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read their transactions"
on public.transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their transactions"
on public.transactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their transactions"
on public.transactions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their transactions"
on public.transactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their recurring expenses"
on public.recurring_expenses
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their recurring expenses"
on public.recurring_expenses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their recurring expenses"
on public.recurring_expenses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their recurring expenses"
on public.recurring_expenses
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their AI reports"
on public.ai_reports
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their settings"
on public.user_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their settings"
on public.user_settings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their settings"
on public.user_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;

grant select, insert, update, delete
on public.transactions
to authenticated;

grant select, insert, update, delete
on public.recurring_expenses
to authenticated;

grant select
on public.ai_reports
to authenticated;

grant select, insert, update
on public.user_settings
to authenticated;
