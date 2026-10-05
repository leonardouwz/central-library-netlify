/**
 * Netlify Database (Postgres) implementations of the application ports,
 * built with Drizzle ORM. This is the only layer that knows about SQL.
 */
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, lt, or, sql, type SQL } from 'drizzle-orm'
import type { PgAsyncDatabase } from 'drizzle-orm/pg-core/async'
import { bookCopies, books, debts, loans, users } from '../../db/schema'
import type { BookInput, CopyStatus } from '@/domain/book'
import type { UserInput, UserStatus } from '@/domain/user'
import type {
  BookRepository,
  CopyRepository,
  DebtRepository,
  LoanQuery,
  LoanRepository,
  Repositories,
  StatsRepository,
  UserRepository,
} from '@/application/ports'
import type { DebtFilter } from '@/application/views'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Executor = PgAsyncDatabase<any, any, any, any>

const like = (term: string) => `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`

const bookColumns = {
  id: books.id,
  title: books.title,
  author: books.author,
  isbn: books.isbn,
  publishedYear: books.publishedYear,
  description: books.description,
  createdAt: books.createdAt,
  updatedAt: books.updatedAt,
}

const stockColumns = {
  ...bookColumns,
  totalCopies: sql<number>`count(${bookCopies.id})::int`,
  availableCopies: sql<number>`(count(${bookCopies.id}) filter (where ${bookCopies.status} = 'AVAILABLE'))::int`,
}

function bookRepository(db: Executor): BookRepository {
  const withStock = (where?: SQL) =>
    db
      .select(stockColumns)
      .from(books)
      .leftJoin(bookCopies, eq(bookCopies.bookId, books.id))
      .where(where)
      .groupBy(books.id)

  return {
    async list(search) {
      const where = search
        ? or(ilike(books.title, like(search)), ilike(books.author, like(search)), ilike(books.isbn, like(search)))
        : undefined
      return withStock(where).orderBy(asc(books.title))
    },
    async findById(id) {
      const [row] = await withStock(eq(books.id, id))
      return row ?? null
    },
    async findByIsbn(isbn) {
      const [row] = await db.select(bookColumns).from(books).where(eq(books.isbn, isbn))
      return row ?? null
    },
    async create(input: BookInput) {
      const [row] = await db.insert(books).values(input).returning()
      return row
    },
    async update(id, input: BookInput) {
      const [row] = await db
        .update(books)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(books.id, id))
        .returning()
      return row ?? null
    },
    async delete(id) {
      await db.delete(books).where(eq(books.id, id))
    },
    async hasLoanHistory(id) {
      const [row] = await db
        .select({ n: count() })
        .from(loans)
        .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
        .where(eq(bookCopies.bookId, id))
      return row.n > 0
    },
  }
}

function copyRepository(db: Executor): CopyRepository {
  return {
    async listByBook(bookId) {
      const rows = await db
        .select({
          copy: bookCopies,
          loanId: loans.id,
          dueAt: loans.dueAt,
          userId: users.id,
          userName: users.name,
        })
        .from(bookCopies)
        .leftJoin(loans, and(eq(loans.copyId, bookCopies.id), isNull(loans.returnedAt)))
        .leftJoin(users, eq(users.id, loans.userId))
        .where(eq(bookCopies.bookId, bookId))
        .orderBy(asc(bookCopies.copyNumber))
      return rows.map((r) => ({
        ...r.copy,
        borrower:
          r.loanId !== null && r.userId !== null && r.dueAt && r.userName !== null
            ? { loanId: r.loanId, userId: r.userId, userName: r.userName, dueAt: r.dueAt }
            : null,
      }))
    },
    async highestCopyNumber(bookId) {
      const [row] = await db
        .select({ max: sql<number>`coalesce(max(${bookCopies.copyNumber}), 0)::int` })
        .from(bookCopies)
        .where(eq(bookCopies.bookId, bookId))
      return row.max
    },
    async createMany(copies) {
      if (copies.length === 0) return []
      return db.insert(bookCopies).values(copies).returning()
    },
    async claimAvailable(bookId) {
      // Row-level lock + SKIP LOCKED so concurrent checkouts never grab the same copy.
      const [row] = await db
        .update(bookCopies)
        .set({ status: 'ON_LOAN' })
        .where(
          and(
            eq(bookCopies.status, 'AVAILABLE'),
            eq(
              bookCopies.id,
              sql`(select c.id from book_copies c where c.book_id = ${bookId} and c.status = 'AVAILABLE' order by c.copy_number limit 1 for update skip locked)`,
            ),
          ),
        )
        .returning()
      return row ?? null
    },
    async setStatus(copyId, status: CopyStatus) {
      await db.update(bookCopies).set({ status }).where(eq(bookCopies.id, copyId))
    },
  }
}

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  status: users.status,
  createdAt: users.createdAt,
}

function userRepository(db: Executor): UserRepository {
  const withBalances = (where?: SQL) =>
    db
      .select({
        ...userColumns,
        activeLoans: sql<number>`(select count(*)::int from loans l where l.user_id = ${users.id} and l.returned_at is null)`,
        unpaidDebtCents: sql<number>`(select coalesce(sum(d.amount_cents), 0)::int from debts d where d.user_id = ${users.id} and d.paid_at is null)`,
      })
      .from(users)
      .where(where)

  return {
    async list(search) {
      const where = search ? or(ilike(users.name, like(search)), ilike(users.email, like(search))) : undefined
      return withBalances(where).orderBy(asc(users.name))
    },
    async findById(id) {
      const [row] = await withBalances(eq(users.id, id))
      return row ?? null
    },
    async findByEmail(email) {
      const [row] = await db.select(userColumns).from(users).where(eq(users.email, email))
      return row ?? null
    },
    async create(input: UserInput) {
      const [row] = await db.insert(users).values(input).returning()
      return row
    },
    async update(id, input: UserInput) {
      const [row] = await db.update(users).set(input).where(eq(users.id, id)).returning()
      return row ?? null
    },
    async setStatus(id, status: UserStatus) {
      const [row] = await db.update(users).set({ status }).where(eq(users.id, id)).returning()
      return row ?? null
    },
    async delete(id) {
      await db.delete(users).where(eq(users.id, id))
    },
    async hasHistory(id) {
      const [row] = await db.select({ n: count() }).from(loans).where(eq(loans.userId, id))
      return row.n > 0
    },
  }
}

const loanRecordColumns = {
  id: loans.id,
  copyId: loans.copyId,
  userId: loans.userId,
  loanedAt: loans.loanedAt,
  dueAt: loans.dueAt,
  returnedAt: loans.returnedAt,
  copy: { id: bookCopies.id, code: bookCopies.code },
  book: { id: books.id, title: books.title, author: books.author },
  user: { id: users.id, name: users.name, email: users.email },
}

function loanRepository(db: Executor): LoanRepository {
  const records = (where?: SQL) =>
    db
      .select(loanRecordColumns)
      .from(loans)
      .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
      .innerJoin(books, eq(bookCopies.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .where(where)

  return {
    async create(loan) {
      const [row] = await db.insert(loans).values(loan).returning()
      return row
    },
    async findRecord(id) {
      const [row] = await records(eq(loans.id, id))
      return row ?? null
    },
    async close(id, returnedAt) {
      const [row] = await db
        .update(loans)
        .set({ returnedAt })
        .where(and(eq(loans.id, id), isNull(loans.returnedAt)))
        .returning()
      return row ?? null
    },
    async list(query: LoanQuery) {
      const where = and(
        query.userId !== undefined ? eq(loans.userId, query.userId) : undefined,
        query.openOnly ? isNull(loans.returnedAt) : undefined,
        query.returnedOnly ? isNotNull(loans.returnedAt) : undefined,
        query.dueBefore ? lt(loans.dueAt, query.dueBefore) : undefined,
      )
      const ordered = records(where).orderBy(
        ...(query.dueBefore ? [asc(loans.dueAt)] : [desc(loans.loanedAt), desc(loans.id)]),
      )
      return query.limit ? ordered.limit(query.limit) : ordered
    },
  }
}

function debtRepository(db: Executor): DebtRepository {
  const records = (where?: SQL) =>
    db
      .select({
        id: debts.id,
        loanId: debts.loanId,
        userId: debts.userId,
        daysLate: debts.daysLate,
        dailyFeeCents: debts.dailyFeeCents,
        amountCents: debts.amountCents,
        createdAt: debts.createdAt,
        paidAt: debts.paidAt,
        user: { id: users.id, name: users.name },
        book: { id: books.id, title: books.title },
        copyCode: bookCopies.code,
      })
      .from(debts)
      .innerJoin(users, eq(debts.userId, users.id))
      .innerJoin(loans, eq(debts.loanId, loans.id))
      .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
      .innerJoin(books, eq(bookCopies.bookId, books.id))
      .where(where)

  return {
    async create(input) {
      const [row] = await db.insert(debts).values(input).returning()
      return row
    },
    async findRecord(id) {
      const [row] = await records(eq(debts.id, id))
      return row ?? null
    },
    async list(filter: DebtFilter, userId) {
      const where = and(
        userId !== undefined ? eq(debts.userId, userId) : undefined,
        filter === 'unpaid' ? isNull(debts.paidAt) : filter === 'paid' ? isNotNull(debts.paidAt) : undefined,
      )
      return records(where).orderBy(sql`${debts.paidAt} is not null`, desc(debts.createdAt))
    },
    async countUnpaidByUser(userId) {
      const [row] = await db
        .select({ n: count() })
        .from(debts)
        .where(and(eq(debts.userId, userId), isNull(debts.paidAt)))
      return row.n
    },
    async markPaid(id, paidAt) {
      const [row] = await db
        .update(debts)
        .set({ paidAt })
        .where(and(eq(debts.id, id), isNull(debts.paidAt)))
        .returning()
      return row ?? null
    },
  }
}

function statsRepository(db: Executor): StatsRepository {
  return {
    async snapshot(overdueBefore) {
      const [[b], [c], [l], [u], [d]] = await Promise.all([
        db.select({ titles: count() }).from(books),
        db
          .select({
            copies: count(),
            available: sql<number>`(count(*) filter (where ${bookCopies.status} = 'AVAILABLE'))::int`,
          })
          .from(bookCopies),
        db
          .select({
            active: count(),
            overdue: sql<number>`(count(*) filter (where ${lt(loans.dueAt, overdueBefore)}))::int`,
          })
          .from(loans)
          .where(isNull(loans.returnedAt)),
        db
          .select({
            total: count(),
            active: sql<number>`(count(*) filter (where ${users.status} = 'ACTIVE'))::int`,
          })
          .from(users),
        db
          .select({ n: count(), cents: sql<number>`coalesce(sum(${debts.amountCents}), 0)::int` })
          .from(debts)
          .where(isNull(debts.paidAt)),
      ])
      return {
        titles: b.titles,
        copies: c.copies,
        availableCopies: c.available,
        activeLoans: l.active,
        overdueLoans: l.overdue,
        activeUsers: u.active,
        totalUsers: u.total,
        unpaidDebtCount: d.n,
        unpaidDebtCents: d.cents,
      }
    },
  }
}

export function createRepositories(db: Executor): Repositories {
  return {
    books: bookRepository(db),
    copies: copyRepository(db),
    users: userRepository(db),
    loans: loanRepository(db),
    debts: debtRepository(db),
    stats: statsRepository(db),
  }
}
