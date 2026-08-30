drop policy if exists "Users can create their transactions"
on public.transactions;

create policy "Users can create their transactions"
on public.transactions
for insert
to authenticated
with check (
  (select auth.uid()) = transactions.user_id
  and (
    transactions.recurring_expense_id is null
    or exists (
      select 1
      from public.recurring_expenses expense
      where expense.id = transactions.recurring_expense_id
        and expense.user_id = transactions.user_id
    )
  )
);

drop policy if exists "Users can update their transactions"
on public.transactions;

create policy "Users can update their transactions"
on public.transactions
for update
to authenticated
using ((select auth.uid()) = transactions.user_id)
with check (
  (select auth.uid()) = transactions.user_id
  and (
    transactions.recurring_expense_id is null
    or exists (
      select 1
      from public.recurring_expenses expense
      where expense.id = transactions.recurring_expense_id
        and expense.user_id = transactions.user_id
    )
  )
);

drop policy if exists "Users can create valid recurring payments"
on public.recurring_payments;

create policy "Users can create valid recurring payments"
on public.recurring_payments
for insert
to authenticated
with check (
  (select auth.uid()) = recurring_payments.user_id
  and exists (
    select 1
    from public.recurring_expenses expense
    where expense.id = recurring_payments.recurring_expense_id
      and expense.user_id = recurring_payments.user_id
  )
  and exists (
    select 1
    from public.transactions transaction
    where transaction.id = recurring_payments.transaction_id
      and transaction.user_id = recurring_payments.user_id
      and transaction.recurring_expense_id =
        recurring_payments.recurring_expense_id
      and transaction.kind = 'expense'
  )
);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
