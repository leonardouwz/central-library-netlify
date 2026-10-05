import { createServerFn } from '@tanstack/react-start'
import { run, services } from './container.server'
import { checkoutSchema, idSchema, loanFilterSchema } from './schemas'

export const listLoans = createServerFn({ method: 'GET' })
  .inputValidator(loanFilterSchema)
  .handler(({ data }) => run(() => services.loans.list(data.filter)))

export const checkoutBook = createServerFn({ method: 'POST' })
  .inputValidator(checkoutSchema)
  .handler(({ data }) => run(() => services.loans.checkout(data.userId, data.bookId)))

export const returnLoan = createServerFn({ method: 'POST' })
  .inputValidator(idSchema)
  .handler(({ data }) => run(() => services.loans.return(data.id)))
