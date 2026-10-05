import { MAX_COPIES_PER_BATCH, planNewCopies, type BookInput } from '@/domain/book'
import { conflict, invalid, notFound, rule } from '@/domain/errors'
import { toBookSummary, toCopyView } from './mappers'
import type { UnitOfWork } from './ports'
import type { BookDetail, BookSummary, CopyView } from './views'

function normalize(input: BookInput): BookInput {
  const title = input.title.trim()
  const author = input.author.trim()
  if (!title) throw invalid('Title is required.')
  if (!author) throw invalid('Author is required.')
  const isbn = input.isbn?.replace(/[\s-]/g, '') || null
  return { title, author, isbn, publishedYear: input.publishedYear, description: input.description.trim() }
}

export class BookService {
  constructor(private readonly uow: UnitOfWork) {}

  async list(search?: string): Promise<BookSummary[]> {
    const books = await this.uow.repos.books.list(search?.trim() || undefined)
    return books.map(toBookSummary)
  }

  async get(id: number): Promise<BookDetail> {
    const { books, copies } = this.uow.repos
    const book = await books.findById(id)
    if (!book) throw notFound('Book', id)
    const [copyList, hasLoanHistory] = await Promise.all([copies.listByBook(id), books.hasLoanHistory(id)])
    return { ...toBookSummary(book), copies: copyList.map(toCopyView), hasLoanHistory }
  }

  /** Creates a title and optionally generates its first copies in one step. */
  async create(input: BookInput, initialCopies = 0): Promise<BookSummary> {
    const data = normalize(input)
    return this.uow.transaction(async (repos) => {
      if (data.isbn && (await repos.books.findByIsbn(data.isbn))) {
        throw conflict(`A book with ISBN ${data.isbn} already exists.`)
      }
      const book = await repos.books.create(data)
      if (initialCopies > 0) {
        await repos.copies.createMany(planNewCopies(book.id, 0, initialCopies))
      }
      return toBookSummary((await repos.books.findById(book.id))!)
    })
  }

  async update(id: number, input: BookInput): Promise<BookSummary> {
    const data = normalize(input)
    const { books } = this.uow.repos
    if (data.isbn) {
      const existing = await books.findByIsbn(data.isbn)
      if (existing && existing.id !== id) throw conflict(`ISBN ${data.isbn} belongs to “${existing.title}”.`)
    }
    const updated = await books.update(id, data)
    if (!updated) throw notFound('Book', id)
    return toBookSummary((await books.findById(id))!)
  }

  /**
   * Titles whose copies have ever circulated are kept so loan and debt history
   * stays intact.
   */
  async delete(id: number): Promise<void> {
    const { books } = this.uow.repos
    if (!(await books.findById(id))) throw notFound('Book', id)
    if (await books.hasLoanHistory(id)) {
      throw rule('This book has loan history and cannot be deleted; its records are needed for loans and debts.')
    }
    await books.delete(id)
  }

  /** Adds stock: each unit becomes a new, uniquely coded BookCopy. */
  async addStock(bookId: number, quantity: number): Promise<CopyView[]> {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_COPIES_PER_BATCH) {
      throw invalid(`Quantity must be a whole number between 1 and ${MAX_COPIES_PER_BATCH}.`)
    }
    return this.uow.transaction(async (repos) => {
      if (!(await repos.books.findById(bookId))) throw notFound('Book', bookId)
      const highest = await repos.copies.highestCopyNumber(bookId)
      const created = await repos.copies.createMany(planNewCopies(bookId, highest, quantity))
      return created.map((c) => toCopyView({ ...c, borrower: null }))
    })
  }
}
