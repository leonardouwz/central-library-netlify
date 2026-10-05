# AGENTS.md

This file is a guide for developers and AI agents working on **Stacks**, a library management system. It covers books and their copies, members, loans and late-fee debts. There is intentionally no authentication: every action is public.

## Stack

TanStack Start (React 19 + TanStack Router + Vite 7), Tailwind CSS 4, Netlify Database (Postgres) through Drizzle ORM `@beta` (`drizzle-orm/netlify-db`), and Zod. The app deploys to Netlify, where server functions run as Netlify Functions.

## Layers (clean architecture)

Dependencies point inward: UI → server adapters → application → domain. Infrastructure implements the application ports.

| Layer | Path | Notes |
|-------|------|-------|
| Domain | `src/domain/` | Pure TypeScript. Holds entities (`Book`, `BookCopy`, `User`, `Loan`, `Debt`), business constants and rules (`assertCanBorrow`, `daysLate`, `assessLateFee`, `planNewCopies`), and `DomainError`. It has no framework or database imports. |
| Application | `src/application/` | Use-case services (`BookService`, `UserService`, `LoanService`, `DebtService`, `DashboardService`), ports (`ports.ts`: repositories, `UnitOfWork`, `Clock`), serializable view models (`views.ts`, where dates are ISO strings), and `mappers.ts`. |
| Infrastructure | `src/infrastructure/`, `db/` | `db/schema.ts` is the Drizzle schema and source of truth. `drizzle-repositories.ts` implements every port. `unit-of-work.ts` wraps `db.transaction`. |
| Server adapters | `src/server/` | `*.functions.ts` expose `createServerFn` endpoints, validated with Zod (`schemas.ts`). `container.server.ts` is the composition root; import it only from handlers. `run()` turns `DomainError` into a UI-safe `Error` message. |
| UI | `src/routes/`, `src/components/` | File-based routes: `/` (Front desk dashboard), `/books`, `/books/$bookId`, `/users`, `/users/$userId`, `/loans?filter=`, `/debts?filter=`. Shared widgets are in `components/ui.tsx` (primitives), `components/library.tsx` (loan/debt tables, badges) and `components/forms.tsx` (book/member/loan modals). |

## Key decisions

- **Copies**: each copy gets a per-book `copy_number` and a unique `code` of the form `BK-<bookId:4>-<copyNumber:3>`. A checkout claims the lowest-numbered available copy with `FOR UPDATE SKIP LOCKED` inside a transaction, so concurrent checkouts never take the same copy.
- **Overdue/late**: lateness is counted in whole UTC calendar days after the due date, so returning a book on its due date is on time. A loan is overdue when `due_at < start of today (UTC)` (`overdueCutoff`).
- **Money** is stored in integer cents. Each debt stores its own `daily_fee_cents` snapshot, so later fee changes don't rewrite history.
- **Deletes**: books or members with any loan history can't be deleted, which keeps loan and debt records intact. Members should be set to INACTIVE instead. Deleting a book with no history also removes its copies (cascade).
- **Refreshing after mutations**: `src/lib/use-action.ts` calls `router.invalidate()` after a successful mutation, so every loader re-fetches.

## Conventions

- Business rules belong in `src/domain`, and orchestration and transactions belong in services. Don't put SQL or Drizzle anywhere outside `src/infrastructure` and `db/`.
- New endpoints follow this path: Zod schema → `*.functions.ts` → service method → port → repository.
- Schema changes: edit `db/schema.ts`, then run `npx drizzle-kit generate --name <verb_description>`. Never edit applied migrations, and never run migrate/push.
- Styling uses the theme tokens in `src/styles.css` (`paper`, `ink`, `moss`, `brass`, `oxblood`), with fonts Fraunces (display), Instrument Sans (body) and IBM Plex Mono (codes/labels).
- The `@/` import alias maps to `src/`.
