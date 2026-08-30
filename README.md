# Finova

Finova is a local personal finance tracker I built with Next.js, TypeScript, SQLite, and Drizzle ORM. It is meant to be simple to run on one computer without setting up an account, hosted database, or deployment service.

All finance data is stored locally in `data/finova.db`.

## What it does

- Dashboard with balance, income, spending, cash flow, category totals, and daily trends
- Add, edit, delete, search, and filter income and expense transactions
- Track recurring monthly bills and mark them paid
- Marking a recurring bill paid creates the linked expense transaction automatically
- Track free trials, expected charge dates, card labels, notes, and cancelled trials
- Daily, weekly, monthly, and custom financial reports
- Local settings for starting balance, monthly budget, currency, and time zone
- Responsive desktop and mobile layout

## Requirements

- Node.js 22 or newer
- npm
- Git, if cloning the repository instead of downloading the ZIP

No environment variables are required. Finova does not require Supabase, Vercel, OpenAI, or another cloud database.

## Install locally

Clone the repository:

```bash
git clone https://github.com/Mdarwish0523/Finova.git
cd Finova
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local address printed in the terminal, normally:

```text
http://localhost:3000
```

If port 3000 is already being used, Next.js will choose another port such as 3001.

## Local database

Finova creates its SQLite database automatically the first time the app accesses it:

```text
data/finova.db
```

The `data` directory and SQLite database files are ignored by Git, so personal finance records are not committed to the repository.

To start with a completely empty database, stop Finova and remove the local database:

```bash
rm -f data/finova.db data/finova.db-shm data/finova.db-wal
```

Start the app again and the database will be recreated automatically.

If I want to inspect the database directly during development, I can also run:

```bash
npm run db:studio
```

## Production build

Check the project before building:

```bash
npm run lint
npm run build
```

Run the production build locally with:

```bash
npm run start
```

## Project structure

```text
app/                    Next.js routes and server actions
components/finance/     Finova UI components
lib/db/                  SQLite connection, schema, and queries
lib/finance/             Calculations, dates, formatting, and validation
data/                     Local SQLite database, created at runtime
```

## Notes

Finova is currently designed as a single-user local application. There is no login system because the database is stored on the machine running the app.

Free-trial reminder flags are stored with the trial for reference, but this local version does not run a cloud push-notification service in the background.
