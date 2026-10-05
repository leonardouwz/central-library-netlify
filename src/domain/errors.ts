export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'BUSINESS_RULE'

/** Expected, user-facing failure raised by domain rules or use cases. */
export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export const notFound = (entity: string, id: number | string) =>
  new DomainError('NOT_FOUND', `${entity} #${id} was not found.`)

export const rule = (message: string) => new DomainError('BUSINESS_RULE', message)
export const conflict = (message: string) => new DomainError('CONFLICT', message)
export const invalid = (message: string) => new DomainError('VALIDATION', message)
