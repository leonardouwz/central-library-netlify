import { z } from 'zod'

export const idSchema = z.object({ id: z.number().int().positive() })

export const searchSchema = z.object({ search: z.string().max(200).optional() })

const optionalText = z
  .string()
  .max(2000)
  .nullish()
  .transform((v) => v ?? null)

export const bookInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  author: z.string().min(1, 'Author is required').max(300),
  isbn: optionalText,
  publishedYear: z.number().int().min(0).max(3000).nullish().transform((v) => v ?? null),
  description: z.string().max(5000).default(''),
})

export const createBookSchema = bookInputSchema.extend({
  initialCopies: z.number().int().min(0).max(100).default(0),
})

export const updateBookSchema = bookInputSchema.extend({ id: z.number().int().positive() })

export const addStockSchema = z.object({
  bookId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
})

export const userInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().max(320),
  phone: optionalText,
})

export const updateUserSchema = userInputSchema.extend({ id: z.number().int().positive() })

export const userStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export const loanFilterSchema = z.object({
  filter: z.enum(['all', 'active', 'overdue', 'returned']).default('all'),
})

export const checkoutSchema = z.object({
  userId: z.number().int().positive(),
  bookId: z.number().int().positive(),
})

export const debtFilterSchema = z.object({
  filter: z.enum(['all', 'unpaid', 'paid']).default('all'),
})
