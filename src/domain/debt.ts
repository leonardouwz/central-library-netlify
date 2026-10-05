import { daysLate } from './loan'

/** Late fee charged per day overdue, in cents. */
export const DAILY_LATE_FEE_CENTS = 50

export interface Debt {
  id: number
  loanId: number
  userId: number
  daysLate: number
  dailyFeeCents: number
  amountCents: number
  createdAt: Date
  paidAt: Date | null
}

export interface LateFee {
  daysLate: number
  dailyFeeCents: number
  amountCents: number
}

/** Returns the fee owed for a return, or `null` when the item came back on time. */
export function assessLateFee(
  dueAt: Date,
  returnedAt: Date,
  dailyFeeCents = DAILY_LATE_FEE_CENTS,
): LateFee | null {
  const late = daysLate(dueAt, returnedAt)
  if (late === 0) return null
  return { daysLate: late, dailyFeeCents, amountCents: late * dailyFeeCents }
}
