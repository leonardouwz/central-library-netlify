import { createServerFn } from '@tanstack/react-start'
import { run, services } from './container.server'
import { idSchema, searchSchema, updateUserSchema, userInputSchema, userStatusSchema } from './schemas'

export const listUsers = createServerFn({ method: 'GET' })
  .inputValidator(searchSchema)
  .handler(({ data }) => run(() => services.users.list(data.search)))

export const getUser = createServerFn({ method: 'GET' })
  .inputValidator(idSchema)
  .handler(({ data }) => run(() => services.users.get(data.id)))

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(userInputSchema)
  .handler(({ data }) => run(() => services.users.create(data)))

export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator(updateUserSchema)
  .handler(({ data: { id, ...input } }) => run(() => services.users.update(id, input)))

export const setUserStatus = createServerFn({ method: 'POST' })
  .inputValidator(userStatusSchema)
  .handler(({ data }) => run(() => services.users.setStatus(data.id, data.status)))

export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator(idSchema)
  .handler(({ data }) => run(() => services.users.delete(data.id)))
