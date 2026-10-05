# Stacks — Library Desk

Stacks is a library management system for the circulation desk. You can use it to run a small library's catalog, members, loans and late fees in one place.

- **Catalog**: create, edit and delete books. A *Book* is the title itself, and each *BookCopy* is a physical item with its own shelf code (e.g. `BK-0007-003`). When you add stock, the app generates new uniquely coded copies.
- **Members**: create and edit members, switch them between ACTIVE and INACTIVE, and see each member's active loans and debts.
- **Loans**: check out a title (the next available copy is assigned automatically), return it, and list loans with *All / Checked out / Overdue / Returned* filters.
- **Debts**: returning a book after its due date creates a debt automatically (days late × daily fee). You can list debts and mark them as paid.

## Business rules

| Rule | Where it lives |
|------|----------------|
| Loans last 14 days | `src/domain/loan.ts` → `LOAN_PERIOD_DAYS` |
| Late fee is $0.50 per calendar day late (UTC) | `src/domain/debt.ts` → `DAILY_LATE_FEE_CENTS` |
| Inactive members can't borrow | `assertCanBorrow` in `src/domain/loan.ts` |
| Members with unpaid debts can't borrow | `assertCanBorrow` in `src/domain/loan.ts` |
| Returning a book on its due date is on time | `daysLate` in `src/domain/loan.ts` |
| Books and members with loan history can't be deleted (deactivate members instead) | `BookService.delete`, `UserService.delete` |

## Tech stack

- **TanStack Start** (React 19, TanStack Router, Vite): a full-stack React framework. Its server functions deploy as Netlify Functions through `@netlify/vite-plugin-tanstack-start`.
- **Netlify Database**: managed Postgres, accessed through **Drizzle ORM** (`drizzle-orm/netlify-db`). Migrations are applied automatically on deploy.
- **Zod** to validate input at the API boundary.
- **Tailwind CSS 4** for styling, and **lucide-react** for icons.

## Architecture

```
UI (src/routes, src/components)
   │ calls
Server functions (src/server/*.functions.ts)      ← API adapters, Zod validation
   │ call
Application services (src/application)            ← use cases, ports (interfaces), view models
   │ use
Domain (src/domain)                               ← pure entities & business rules
   ▲ implemented by
Infrastructure (src/infrastructure, db/)          ← Drizzle repositories, transactions
```

The domain and application layers don't import any framework or database code. `src/server/container.server.ts` is the composition root that connects the infrastructure to the services.

## Running locally

```bash
pnpm install
netlify dev          # runs the app with Netlify Database + Functions emulation
```

## Changing the schema

1. Edit `db/schema.ts`.
2. Run `npx drizzle-kit generate --name <what_changed>`.
3. Commit the new folder in `netlify/database/migrations/`. Netlify applies it on the next deploy.
