/**
 * Persistence ports. The application layer depends only on these interfaces;
 * `src/infrastructure` provides the Drizzle/Netlify Database implementations.
 */
import type { Book, BookCopy, BookInput, CopyStatus } from '@/domain/book'
import type { Debt, LateFee } from '@/domain/debt'
import type { Loan } from '@/domain/loan'
import type { User, UserInput, UserStatus } from '@/domain/user'
import type { DashboardStats, DebtFilter } from './views'

export interface BookWithStock extends Book {
  totalCopies: number
  availableCopies: number
}

export interface CopyWithBorrower extends BookCopy {
  borrower: { loanId: number; userId: number; userName: string; dueAt: Date } | null
}

export interface UserWithBalances extends User {
  activeLoans: number
  unpaidDebtCents: number
}

/** A loan joined with the copy, book and borrower it refers to. */
export interface LoanRecord extends Loan {
  copy: { id: number; code: string }
  book: { id: number; title: string; author: string }
  user: { id: number; name: string; email: string }
}

export interface DebtRecord extends Debt {
  user: { id: number; name: string }
  book: { id: number; title: string }
  copyCode: string
}

export interface LoanQuery {
  userId?: number
  openOnly?: boolean
  returnedOnly?: boolean
  /** Only loans due strictly before this instant. */
  dueBefore?: Date
  limit?: number
}

export interface BookRepository {
  list(search?: string): Promise<BookWithStock[]>
  findById(id: number): Promise<BookWithStock | null>
  findByIsbn(isbn: string): Promise<Book | null>
  create(input: BookInput): Promise<Book>
  update(id: number, input: BookInput): Promise<Book | null>
  delete(id: number): Promise<void>
  hasLoanHistory(id: number): Promise<boolean>
}

export interface CopyRepository {
  listByBook(bookId: number): Promise<CopyWithBorrower[]>
  highestCopyNumber(bookId: number): Promise<number>
  createMany(copies: { bookId: number; copyNumber: number; code: string }[]): Promise<BookCopy[]>
  /** Atomically reserves the lowest-numbered available copy of a book, or returns null. */
  claimAvailable(bookId: number): Promise<BookCopy | null>
  setStatus(copyId: number, status: CopyStatus): Promise<void>
}

export interface UserRepository {
  list(search?: string): Promise<UserWithBalances[]>
  findById(id: number): Promise<UserWithBalances | null>
  findByEmail(email: string): Promise<User | null>
  create(input: UserInput): Promise<User>
  update(id: number, input: UserInput): Promise<User | null>
  setStatus(id: number, status: UserStatus): Promise<User | null>
  delete(id: number): Promise<void>
  hasHistory(id: number): Promise<boolean>
}

export interface LoanRepository {
  create(loan: Omit<Loan, 'id' | 'returnedAt'>): Promise<Loan>
  findRecord(id: number): Promise<LoanRecord | null>
  /** Marks an open loan as returned; returns null if it was already closed. */
  close(id: number, returnedAt: Date): Promise<Loan | null>
  list(query: LoanQuery): Promise<LoanRecord[]>
}

export interface DebtRepository {
  create(input: { loanId: number; userId: number } & LateFee): Promise<Debt>
  findRecord(id: number): Promise<DebtRecord | null>
  list(filter: DebtFilter, userId?: number): Promise<DebtRecord[]>
  countUnpaidByUser(userId: number): Promise<number>
  /** Marks an unpaid debt as paid; returns null if it was already paid. */
  markPaid(id: number, paidAt: Date): Promise<Debt | null>
}

export interface StatsRepository {
  snapshot(overdueBefore: Date): Promise<DashboardStats>
}

export interface Repositories {
  books: BookRepository
  copies: CopyRepository
  users: UserRepository
  loans: LoanRepository
  debts: DebtRepository
  stats: StatsRepository
}

export interface UnitOfWork {
  /** Repositories bound to the default connection. */
  repos: Repositories
  /** Runs `work` atomically; everything commits or rolls back together. */
  transaction<T>(work: (repos: Repositories) => Promise<T>): Promise<T>
}

export interface Clock {
  now(): Date
}
