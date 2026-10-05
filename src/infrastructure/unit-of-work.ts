import type { Clock, UnitOfWork } from '@/application/ports'
import { createRepositories, type Executor } from './drizzle-repositories'

export function createUnitOfWork(db: Executor): UnitOfWork {
  return {
    repos: createRepositories(db),
    transaction: (work) => db.transaction((tx) => work(createRepositories(tx))),
  }
}

export const systemClock: Clock = { now: () => new Date() }
