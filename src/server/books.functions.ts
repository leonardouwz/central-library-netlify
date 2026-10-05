import { createServerFn } from '@tanstack/react-start'
import { run, services } from './container.server'
import { addStockSchema, createBookSchema, idSchema, searchSchema, updateBookSchema } from './schemas'

export const listBooks = createServerFn({ method: 'GET' })
  .inputValidator(searchSchema)
  .handler(({ data }) => run(() => services.books.list(data.search)))

export const getBook = createServerFn({ method: 'GET' })
  .inputValidator(idSchema)
  .handler(({ data }) => run(() => services.books.get(data.id)))

export const createBook = createServerFn({ method: 'POST' })
  .inputValidator(createBookSchema)
  .handler(({ data: { initialCopies, ...input } }) => run(() => services.books.create(input, initialCopies)))

export const updateBook = createServerFn({ method: 'POST' })
  .inputValidator(updateBookSchema)
  .handler(({ data: { id, ...input } }) => run(() => services.books.update(id, input)))

export const deleteBook = createServerFn({ method: 'POST' })
  .inputValidator(idSchema)
  .handler(({ data }) => run(() => services.books.delete(data.id)))

export const addStock = createServerFn({ method: 'POST' })
  .inputValidator(addStockSchema)
  .handler(({ data }) => run(() => services.books.addStock(data.bookId, data.quantity)))
