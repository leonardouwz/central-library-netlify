/**
 * Composition root: wires infrastructure into the application services.
 * Server-only — imported exclusively from server function handlers.
 */
import { db } from '../../db'
import { BookService } from '@/application/book-service'
import { DashboardService } from '@/application/dashboard-service'
import { DebtService } from '@/application/debt-service'
import { LoanService } from '@/application/loan-service'
import { UserService } from '@/application/user-service'
import { DomainError } from '@/domain/errors'
import type { Executor } from '@/infrastructure/drizzle-repositories'
import { createUnitOfWork, systemClock } from '@/infrastructure/unit-of-work'

const uow = createUnitOfWork(db as unknown as Executor)

export const services = {
  books: new BookService(uow),
  users: new UserService(uow, systemClock),
  loans: new LoanService(uow, systemClock),
  debts: new DebtService(uow, systemClock),
  dashboard: new DashboardService(uow, systemClock),
}

/**
 * Runs a use case and turns failures into plain `Error`s whose message is safe
 * to show in the UI. Unexpected errors are logged and replaced with a generic one.
 */
export async function run<T>(useCase: () => Promise<T>): Promise<T> {
  try {
    return await useCase()
  } catch (error) {
    if (error instanceof DomainError) throw new Error(error.message)
    const pgCode = (error as { code?: string; cause?: { code?: string } })?.code ??
      (error as { cause?: { code?: string } })?.cause?.code
    if (pgCode === '23505') throw new Error('That record conflicts with an existing one (duplicate value).')
    console.error(error)
    throw new Error('Something went wrong while talking to the database. Please try again.')
  }
}
