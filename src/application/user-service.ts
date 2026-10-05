import { conflict, invalid, notFound, rule } from '@/domain/errors'
import type { UserInput, UserStatus } from '@/domain/user'
import { toDebtView, toLoanView, toUserSummary } from './mappers'
import type { Clock, UnitOfWork } from './ports'
import type { UserDetail, UserSummary } from './views'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalize(input: UserInput): UserInput {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw invalid('Name is required.')
  if (!EMAIL.test(email)) throw invalid('A valid email address is required.')
  return { name, email, phone: input.phone?.trim() || null }
}

export class UserService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async list(search?: string): Promise<UserSummary[]> {
    const users = await this.uow.repos.users.list(search?.trim() || undefined)
    return users.map(toUserSummary)
  }

  /** Profile plus the member's open loans and full debt history. */
  async get(id: number): Promise<UserDetail> {
    const { users, loans, debts } = this.uow.repos
    const user = await users.findById(id)
    if (!user) throw notFound('User', id)
    const now = this.clock.now()
    const [openLoans, debtList, hasHistory] = await Promise.all([
      loans.list({ userId: id, openOnly: true }),
      debts.list('all', id),
      users.hasHistory(id),
    ])
    return {
      ...toUserSummary(user),
      loans: openLoans.map((l) => toLoanView(l, now)),
      debts: debtList.map(toDebtView),
      hasHistory,
    }
  }

  async create(input: UserInput): Promise<UserSummary> {
    const data = normalize(input)
    const { users } = this.uow.repos
    if (await users.findByEmail(data.email)) throw conflict(`${data.email} is already registered.`)
    const user = await users.create(data)
    return toUserSummary({ ...user, activeLoans: 0, unpaidDebtCents: 0 })
  }

  async update(id: number, input: UserInput): Promise<UserSummary> {
    const data = normalize(input)
    const { users } = this.uow.repos
    const existing = await users.findByEmail(data.email)
    if (existing && existing.id !== id) throw conflict(`${data.email} belongs to another member.`)
    if (!(await users.update(id, data))) throw notFound('User', id)
    return toUserSummary((await users.findById(id))!)
  }

  async setStatus(id: number, status: UserStatus): Promise<UserSummary> {
    const { users } = this.uow.repos
    if (!(await users.setStatus(id, status))) throw notFound('User', id)
    return toUserSummary((await users.findById(id))!)
  }

  /** Members with loan or debt history are deactivated rather than deleted. */
  async delete(id: number): Promise<void> {
    const { users } = this.uow.repos
    if (!(await users.findById(id))) throw notFound('User', id)
    if (await users.hasHistory(id)) {
      throw rule('This member has loan history and cannot be deleted. Set them to INACTIVE instead.')
    }
    await users.delete(id)
  }
}
