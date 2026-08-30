create table public.free_trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_name text not null,
  start_date date not null,
  duration_days integer not null,
  charge_date date not null,
  card_label text not null,
  notes text,
  status text not null default 'active',
  remind_two_days boolean not null default true,
  remind_one_day boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint free_trials_service_name_length
    check (char_length(service_name) between 1 and 120),
  constraint free_trials_card_label_length
    check (char_length(card_label) between 1 and 120),
  constraint free_trials_notes_length
    check (notes is null or char_length(notes) <= 500),
  constraint free_trials_duration_positive
    check (duration_days > 0),
  constraint free_trials_charge_date_valid
    check (charge_date >= start_date),
  constraint free_trials_charge_date_matches_duration
    check (charge_date = start_date + duration_days),
  constraint free_trials_status_valid
    check (status in ('active', 'cancelled'))
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint push_subscriptions_endpoint_unique
    unique (user_id, endpoint)
);

create table public.trial_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  free_trial_id uuid not null references public.free_trials(id) on delete cascade,
  push_subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  reminder_days smallint not null,
  charge_date date not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),

  constraint trial_notification_deliveries_reminder_days
    check (reminder_days in (1, 2)),
  constraint trial_notification_deliveries_unique
    unique (free_trial_id, push_subscription_id, reminder_days, charge_date)
);

create index free_trials_user_status_charge_date_index
  on public.free_trials (user_id, status, charge_date);

create index push_subscriptions_user_index
  on public.push_subscriptions (user_id);

create index trial_notification_deliveries_user_created_index
  on public.trial_notification_deliveries (user_id, created_at desc);

alter table public.free_trials enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.trial_notification_deliveries enable row level security;

create policy "Users can read their free trials"
on public.free_trials
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their free trials"
on public.free_trials
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their free trials"
on public.free_trials
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their free trials"
on public.free_trials
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their push subscriptions"
on public.push_subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their push subscriptions"
on public.push_subscriptions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.free_trials from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.trial_notification_deliveries from anon, authenticated;

grant select, insert, update, delete
on public.free_trials
to authenticated;

grant select, insert, update, delete
on public.push_subscriptions
to authenticated;

grant select, insert, update, delete
on public.free_trials, public.push_subscriptions, public.trial_notification_deliveries
to service_role;
