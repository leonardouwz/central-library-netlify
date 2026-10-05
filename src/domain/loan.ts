import { rule } from './errors'
import type { User } from './user'

export const LOAN_PERIOD_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

export interface Loan {
  id: number
  copyId: number
  userId: number
  loanedAt: Date
  dueAt: Date
  returnedAt: Date | null
}

export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED'

export function computeDueDate(loanedAt: Date): Date {
  return new Date(loanedAt.getTime() + LOAN_PERIOD_DAYS * DAY_MS)
}

function utcDay(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS)
}

/**
 * Whole calendar days (UTC) between the due date and the reference moment.
 * Returning any time on the due date itself is on time.
 */
export function daysLate(dueAt: Date, at: Date): number {
  return Math.max(0, utcDay(at) - utcDay(dueAt))
}

/** Open loans due before this instant (start of the current UTC day) are overdue. */
export function overdueCutoff(now: Date): Date {
  return new Date(utcDay(now) * DAY_MS)
}

export function loanStatus(loan: Pick<Loan, 'dueAt' | 'returnedAt'>, now: Date): LoanStatus {
  if (loan.returnedAt) return 'RETURNED'
  return daysLate(loan.dueAt, now) > 0 ? 'OVERDUE' : 'ACTIVE'
}

/** Borrowing eligibility: active membership and no unpaid debts. */
export function assertCanBorrow(user: User, unpaidDebtCount: number): void {
  if (user.status !== 'ACTIVE') {
    throw rule(`${user.name} is inactive and cannot borrow books.`)
  }
  if (unpaidDebtCount > 0) {
    throw rule(
      `${user.name} has ${unpaidDebtCount} unpaid debt${unpaidDebtCount === 1 ? '' : 's'} and cannot borrow until settled.`,
    )
  }
}
