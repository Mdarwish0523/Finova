# Finova

Finova is a personal finance tracker I built with Next.js, TypeScript, SQLite, and Drizzle ORM.

## Features

- Dashboard with balance, income, spending, cash flow, category totals, and daily trends
- Add, edit, delete, search, and filter transactions
- Track recurring monthly bills and mark them paid
- Automatically create an expense transaction when a recurring bill is marked paid
- Track free trials and expected charge dates
- Daily, weekly, monthly, and custom financial reports
- Settings for starting balance, monthly budget, currency, and time zone
- Responsive desktop and mobile layout

## Getting started

Requires Node.js 22 or newer and npm.

```bash
git clone https://github.com/Mdarwish0523/Finova.git
cd Finova
npm install
npm run dev
```

Finova saves your data automatically while you use the app.

## Development

Run the project checks with:

```bash
npm run lint
npm run build
```

Useful development command:

```bash
npm run db:studio
```

## Project structure

```text
app/                    Next.js routes and server actions
components/finance/     Finance UI components
lib/db/                  Database connection, schema, and queries
lib/finance/             Calculations, dates, formatting, and validation
```
