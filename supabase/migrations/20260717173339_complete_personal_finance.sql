alter table public.user_settings
  add column starting_balance_cents bigint not null default 0,
  add column ai_analysis_enabled boolean not null default true,
  add column daily_analysis_enabled boolean not null default true,
  add column weekly_analysis_enabled boolean not null default true,
  add column monthly_analysis_enabled boolean not null default true;

create table public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_expense_id uuid not null references public.recurring_expenses(id)
    on delete cascade,
  period_start date not null,
  paid_date date not null,
  transaction_id uuid not null unique references public.transactions(id)
    on delete cascade,
  created_at timestamptz not null default now(),

  constraint recurring_payments_month_start
    check (period_start = date_trunc('month', period_start)::date),

  constraint recurring_payments_unique_bill_month
    unique (recurring_expense_id, period_start)
);

create index recurring_payments_user_period_index
  on public.recurring_payments (user_id, period_start desc);

create index recurring_payments_bill_period_index
  on public.recurring_payments (recurring_expense_id, period_start desc);

alter table public.recurring_payments enable row level security;

create policy "Users can read their recurring payments"
on public.recurring_payments
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create valid recurring payments"
on public.recurring_payments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.recurring_expenses expense
    where expense.id = recurring_expense_id
      and expense.user_id = user_id
  )
  and exists (
    select 1
    from public.transactions transaction
    where transaction.id = transaction_id
      and transaction.user_id = user_id
      and transaction.recurring_expense_id = recurring_expense_id
      and transaction.kind = 'expense'
  )
);

drop policy "Users can create their transactions"
on public.transactions;

create policy "Users can create their transactions"
on public.transactions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    recurring_expense_id is null
    or exists (
      select 1
      from public.recurring_expenses expense
      where expense.id = recurring_expense_id
        and expense.user_id = user_id
    )
  )
);

drop policy "Users can update their transactions"
on public.transactions;

create policy "Users can update their transactions"
on public.transactions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    recurring_expense_id is null
    or exists (
      select 1
      from public.recurring_expenses expense
      where expense.id = recurring_expense_id
        and expense.user_id = user_id
    )
  )
);

create policy "Users can create their AI reports"
on public.ai_reports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their AI reports"
on public.ai_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert
on public.recurring_payments
to authenticated;

grant insert, update
on public.ai_reports
to authenticated;

create or replace function public.mark_recurring_expense_paid(
  p_recurring_expense_id uuid,
  p_period_start date,
  p_paid_date date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  expense public.recurring_expenses%rowtype;
  existing_transaction_id uuid;
  new_transaction_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_period_start <> date_trunc('month', p_period_start)::date then
    raise exception 'Period start must be the first day of a month'
      using errcode = '22023';
  end if;

  select *
  into expense
  from public.recurring_expenses
  where id = p_recurring_expense_id
    and user_id = caller_id
    and active = true
  for update;

  if not found then
    raise exception 'Active recurring expense not found'
      using errcode = 'P0002';
  end if;

  select transaction_id
  into existing_transaction_id
  from public.recurring_payments
  where recurring_expense_id = p_recurring_expense_id
    and period_start = p_period_start;

  if existing_transaction_id is not null then
    return existing_transaction_id;
  end if;

  insert into public.transactions (
    user_id,
    kind,
    amount_cents,
    transaction_date,
    category,
    merchant,
    description,
    notes,
    recurring_expense_id
  ) values (
    caller_id,
    'expense',
    expense.amount_cents,
    p_paid_date,
    expense.category,
    expense.name,
    'Recurring payment',
    expense.notes,
    expense.id
  )
  returning id into new_transaction_id;

  insert into public.recurring_payments (
    user_id,
    recurring_expense_id,
    period_start,
    paid_date,
    transaction_id
  ) values (
    caller_id,
    expense.id,
    p_period_start,
    p_paid_date,
    new_transaction_id
  );

  return new_transaction_id;
end;
$$;

revoke all on function public.mark_recurring_expense_paid(uuid, date, date)
from public, anon;

grant execute on function public.mark_recurring_expense_paid(uuid, date, date)
to authenticated;
