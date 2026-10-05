import { createServerFn } from '@tanstack/react-start'
import { run, services } from './container.server'
import { debtFilterSchema, idSchema } from './schemas'

export const listDebts = createServerFn({ method: 'GET' })
  .inputValidator(debtFilterSchema)
  .handler(({ data }) => run(() => services.debts.list(data.filter)))

export const payDebt = createServerFn({ method: 'POST' })
  .inputValidator(idSchema)
  .handler(({ data }) => run(() => services.debts.markPaid(data.id)))
