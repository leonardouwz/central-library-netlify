import { notFound, rule } from '@/domain/errors'
import { toDebtView } from './mappers'
import type { Clock, UnitOfWork } from './ports'
import type { DebtFilter, DebtView } from './views'

export class DebtService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async list(filter: DebtFilter = 'all'): Promise<DebtView[]> {
    return (await this.uow.repos.debts.list(filter)).map(toDebtView)
  }

  async markPaid(id: number): Promise<DebtView> {
    const { debts } = this.uow.repos
    if (!(await debts.findRecord(id))) throw notFound('Debt', id)
    if (!(await debts.markPaid(id, this.clock.now()))) throw rule(`Debt #${id} is already paid.`)
    return toDebtView((await debts.findRecord(id))!)
  }
}
