/**
 * Serializable read models returned to the UI. Dates are ISO strings so they
 * cross the server-function boundary unchanged.
 */
import type { CopyStatus } from '@/domain/book'
import type { LoanStatus } from '@/domain/loan'
import type { UserStatus } from '@/domain/user'

export interface BookSummary {
  id: number
  title: string
  author: string
  isbn: string | null
  publishedYear: number | null
  description: string
  totalCopies: number
  availableCopies: number
  createdAt: string
}

export interface CopyView {
  id: number
  code: string
  copyNumber: number
  status: CopyStatus
  acquiredAt: string
  borrower: { loanId: number; userId: number; userName: string; dueAt: string } | null
}

export interface BookDetail extends BookSummary {
  copies: CopyView[]
  hasLoanHistory: boolean
}

export interface UserSummary {
  id: number
  name: string
  email: string
  phone: string | null
  status: UserStatus
  createdAt: string
  activeLoans: number
  unpaidDebtCents: number
}

export interface LoanView {
  id: number
  loanedAt: string
  dueAt: string
  returnedAt: string | null
  status: LoanStatus
  daysOverdue: number
  copy: { id: number; code: string }
  book: { id: number; title: string; author: string }
  user: { id: number; name: string; email: string }
}

export interface DebtView {
  id: number
  loanId: number
  daysLate: number
  dailyFeeCents: number
  amountCents: number
  createdAt: string
  paidAt: string | null
  user: { id: number; name: string }
  book: { id: number; title: string }
  copyCode: string
}

export interface UserDetail extends UserSummary {
  loans: LoanView[]
  debts: DebtView[]
  hasHistory: boolean
}

export interface ReturnResult {
  loan: LoanView
  debt: DebtView | null
}

export interface DashboardStats {
  titles: number
  copies: number
  availableCopies: number
  activeLoans: number
  overdueLoans: number
  activeUsers: number
  totalUsers: number
  unpaidDebtCount: number
  unpaidDebtCents: number
}

export type LoanFilter = 'all' | 'active' | 'overdue' | 'returned'
export type DebtFilter = 'all' | 'unpaid' | 'paid'
