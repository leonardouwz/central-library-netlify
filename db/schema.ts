import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

/** A catalog title — the abstract work, independent of physical stock. */
export const books = pgTable('books', {
  id: serial().primaryKey(),
  title: text().notNull(),
  author: text().notNull(),
  isbn: text().unique(),
  publishedYear: integer('published_year'),
  description: text().notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** A physical, individually trackable item belonging to a book. */
export const bookCopies = pgTable(
  'book_copies',
  {
    id: serial().primaryKey(),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    copyNumber: integer('copy_number').notNull(),
    code: text().notNull().unique(),
    status: text({ enum: ['AVAILABLE', 'ON_LOAN'] }).notNull().default('AVAILABLE'),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('book_copies_book_copy_number_idx').on(t.bookId, t.copyNumber),
    index('book_copies_status_idx').on(t.bookId, t.status),
  ],
)

/** Library members (patrons). Not application logins — there is no auth. */
export const users = pgTable('users', {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  phone: text(),
  status: text({ enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const loans = pgTable(
  'loans',
  {
    id: serial().primaryKey(),
    copyId: integer('copy_id')
      .notNull()
      .references(() => bookCopies.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    loanedAt: timestamp('loaned_at', { withTimezone: true }).notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
  },
  (t) => [index('loans_user_idx').on(t.userId), index('loans_copy_idx').on(t.copyId)],
)

export const debts = pgTable(
  'debts',
  {
    id: serial().primaryKey(),
    loanId: integer('loan_id')
      .notNull()
      .unique()
      .references(() => loans.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    daysLate: integer('days_late').notNull(),
    dailyFeeCents: integer('daily_fee_cents').notNull(),
    amountCents: integer('amount_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (t) => [index('debts_user_idx').on(t.userId)],
)
