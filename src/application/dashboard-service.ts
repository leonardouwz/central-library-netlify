import { overdueCutoff } from '@/domain/loan'
import { toLoanView } from './mappers'
import type { Clock, UnitOfWork } from './ports'
import type { DashboardStats, LoanView } from './views'

export class DashboardService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async overview(): Promise<{ stats: DashboardStats; overdue: LoanView[]; recent: LoanView[] }> {
    const now = this.clock.now()
    const { stats, loans } = this.uow.repos
    const [snapshot, overdue, recent] = await Promise.all([
      stats.snapshot(overdueCutoff(now)),
      loans.list({ openOnly: true, dueBefore: overdueCutoff(now) }),
      loans.list({ limit: 6 }),
    ])
    return {
      stats: snapshot,
      overdue: overdue.slice(0, 8).map((l) => toLoanView(l, now)),
      recent: recent.map((l) => toLoanView(l, now)),
    }
  }
}
