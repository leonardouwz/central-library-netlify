import { assessLateFee } from '@/domain/debt'
import { notFound, rule } from '@/domain/errors'
import { assertCanBorrow, computeDueDate, overdueCutoff } from '@/domain/loan'
import { toDebtView, toLoanView } from './mappers'
import type { Clock, LoanQuery, UnitOfWork } from './ports'
import type { LoanFilter, LoanView, ReturnResult } from './views'

export class LoanService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async list(filter: LoanFilter = 'all'): Promise<LoanView[]> {
    const now = this.clock.now()
    const query: LoanQuery =
      filter === 'active'
        ? { openOnly: true }
        : filter === 'overdue'
          ? { openOnly: true, dueBefore: overdueCutoff(now) }
          : filter === 'returned'
            ? { returnedOnly: true }
            : {}
    const loans = await this.uow.repos.loans.list(query)
    return loans.map((l) => toLoanView(l, now))
  }

  /**
   * Lends the next available copy of a title to a member for the standard
   * loan period, after checking borrowing eligibility.
   */
  async checkout(userId: number, bookId: number): Promise<LoanView> {
    const now = this.clock.now()
    return this.uow.transaction(async (repos) => {
      const user = await repos.users.findById(userId)
      if (!user) throw notFound('User', userId)
      assertCanBorrow(user, await repos.debts.countUnpaidByUser(userId))

      const book = await repos.books.findById(bookId)
      if (!book) throw notFound('Book', bookId)
      const copy = await repos.copies.claimAvailable(bookId)
      if (!copy) throw rule(`No copies of “${book.title}” are available right now.`)

      const loan = await repos.loans.create({ copyId: copy.id, userId, loanedAt: now, dueAt: computeDueDate(now) })
      return toLoanView((await repos.loans.findRecord(loan.id))!, now)
    })
  }

  /** Closes a loan, frees the copy and records a debt if it came back late. */
  async return(loanId: number): Promise<ReturnResult> {
    const now = this.clock.now()
    return this.uow.transaction(async (repos) => {
      const record = await repos.loans.findRecord(loanId)
      if (!record) throw notFound('Loan', loanId)
      const closed = await repos.loans.close(loanId, now)
      if (!closed) throw rule(`Loan #${loanId} has already been returned.`)
      await repos.copies.setStatus(closed.copyId, 'AVAILABLE')

      const fee = assessLateFee(closed.dueAt, now)
      const debt = fee ? await repos.debts.create({ loanId, userId: closed.userId, ...fee }) : null

      return {
        loan: toLoanView({ ...record, returnedAt: now }, now),
        debt: debt ? toDebtView((await repos.debts.findRecord(debt.id))!) : null,
      }
    })
  }
}
