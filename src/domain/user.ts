export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  status: UserStatus
  createdAt: Date
}

export interface UserInput {
  name: string
  email: string
  phone: string | null
}
