import { daysLate, loanStatus } from '@/domain/loan'
import type {
  BookWithStock,
  CopyWithBorrower,
  DebtRecord,
  LoanRecord,
  UserWithBalances,
} from './ports'
import type { BookSummary, CopyView, DebtView, LoanView, UserSummary } from './views'

const iso = (d: Date | null) => (d ? d.toISOString() : null)

export const toBookSummary = (b: BookWithStock): BookSummary => ({
  id: b.id,
  title: b.title,
  author: b.author,
  isbn: b.isbn,
  publishedYear: b.publishedYear,
  description: b.description,
  totalCopies: b.totalCopies,
  availableCopies: b.availableCopies,
  createdAt: b.createdAt.toISOString(),
})

export const toCopyView = (c: CopyWithBorrower): CopyView => ({
  id: c.id,
  code: c.code,
  copyNumber: c.copyNumber,
  status: c.status,
  acquiredAt: c.acquiredAt.toISOString(),
  borrower: c.borrower && { ...c.borrower, dueAt: c.borrower.dueAt.toISOString() },
})

export const toUserSummary = (u: UserWithBalances): UserSummary => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  status: u.status,
  createdAt: u.createdAt.toISOString(),
  activeLoans: u.activeLoans,
  unpaidDebtCents: u.unpaidDebtCents,
})

export const toLoanView = (l: LoanRecord, now: Date): LoanView => ({
  id: l.id,
  loanedAt: l.loanedAt.toISOString(),
  dueAt: l.dueAt.toISOString(),
  returnedAt: iso(l.returnedAt),
  status: loanStatus(l, now),
  daysOverdue: l.returnedAt ? daysLate(l.dueAt, l.returnedAt) : daysLate(l.dueAt, now),
  copy: l.copy,
  book: l.book,
  user: l.user,
})

export const toDebtView = (d: DebtRecord): DebtView => ({
  id: d.id,
  loanId: d.loanId,
  daysLate: d.daysLate,
  dailyFeeCents: d.dailyFeeCents,
  amountCents: d.amountCents,
  createdAt: d.createdAt.toISOString(),
  paidAt: iso(d.paidAt),
  user: d.user,
  book: d.book,
  copyCode: d.copyCode,
})
