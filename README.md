# Finova

Finova is a private, owner-only personal finance PWA built with Next.js 16, Supabase Auth/Postgres/RLS, and the OpenAI Responses API.

## Features

- Dashboard balance and cash-flow metrics, recent activity, upcoming bills, category spending, daily trends, and the latest saved insight
- Complete income/expense transaction entry, editing, deletion, search, date/category/type filtering, and date grouping
- Monthly recurring expense schedules with active/paused, upcoming/overdue/paid states
- Atomic **Mark paid** flow that creates one linked expense transaction per bill/month
- Daily, weekly, monthly, and custom reports with deterministic totals and prior-period comparisons
- Optional structured AI budgeting analysis with saved history and graceful failure behavior
- Protected daily Vercel cron that also runs weekly work on Mondays and monthly work on the first day
- Installable light-mode PWA shell with desktop sidebar, mobile bottom navigation, iPhone safe-area support, and app icons

## Required environment variables

Copy `.env.example` to `.env.local` for local development. Never commit real values.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL; safe for the browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key; RLS remains authoritative |
| `OWNER_USER_ID` | The single allowed Supabase Auth user UUID |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only access for the Vercel cron; never prefix with `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | Server-only OpenAI API key |
| `OPENAI_FINANCE_MODEL` | Optional model override; defaults to `gpt-5-mini` |
| `APP_TIMEZONE` | Cron calendar timezone; use `America/New_York` |
| `CRON_SECRET` | Long random bearer token used by Vercel Cron |

The application does not send transaction descriptions, merchant names, credentials, account numbers, or card data to OpenAI. It calculates all metrics in application code and sends only aggregated period totals.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`; unauthenticated visitors are redirected to the existing Supabase login flow.

## Database

Schema changes live in `supabase/migrations`. Apply pending migrations to the linked project with:

```bash
npx supabase db push --linked
```

Regenerate database types after a schema change with:

```bash
npx supabase gen types --linked --lang typescript --schema public > lib/database.types.ts
```

Migration `20260717173339_complete_personal_finance.sql` adds settings preferences, recurring payment tracking, ownership policies/grants, and the idempotent `mark_recurring_expense_paid` function. It has already been applied to the linked project for this worktree.

## Cron

`vercel.json` invokes `/api/cron/finance-analysis` once per day at 09:15 UTC. The route verifies `Authorization: Bearer CRON_SECRET`, uses New York calendar dates, and skips already-saved report periods.

Test the deployed endpoint manually:

```bash
curl --fail-with-body \
  --header "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_DEPLOYMENT.example/api/cron/finance-analysis
```

The cron requires `SUPABASE_SERVICE_ROLE_KEY` in Vercel because it has no interactive user session. That key is imported only from a `server-only` module and is never exposed to client components.

## Validation

```bash
npm run lint
npm run build
```

No service worker caches authenticated transaction/API responses. The manifest, icons, metadata, and standalone mobile shell provide the install experience without persisting private API payloads in browser-managed offline caches.
