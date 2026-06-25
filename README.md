# Pocket Plan Expense Tracker

Pocket Plan is a simple monthly expense tracker for understanding how much money is safe to spend. It helps a signed-in user set monthly income, record fixed expenses, track daily spending, and see the remaining balance for the month.

## What It Does

- Shows a monthly dashboard with income, fixed expenses, spending, remaining balance, and safe daily spending.
- Lets users quickly add an expense from the dashboard.
- Shows recent expenses on the dashboard.
- Provides a transactions page for searching, filtering, adding, editing, and deleting expenses.
- Provides a budget page for setting monthly income and fixed costs.
- Uses Google sign-in through Better Auth.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- tRPC
- TanStack Query
- Prisma
- PostgreSQL
- Better Auth
- Recharts

## Main Routes

- `/dashboard` - monthly overview, quick add, recent expenses, and budget chart.
- `/transactions` - full monthly transaction list with search, filter, edit, and delete.
- `/budget` - monthly income and fixed expense setup.
- `/login` - Google sign-in.

## Local Development

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run checks:

```bash
npm run typecheck
npm run lint
```

## Notes

The app expects database and authentication environment variables to be configured locally. The `.env` file is not included in this README and should stay private.
