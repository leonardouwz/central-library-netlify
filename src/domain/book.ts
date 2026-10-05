export type CopyStatus = 'AVAILABLE' | 'ON_LOAN'

/** The abstract title: what a patron asks for. */
export interface Book {
  id: number
  title: string
  author: string
  isbn: string | null
  publishedYear: number | null
  description: string
  createdAt: Date
  updatedAt: Date
}

/** A physical item on the shelf. Every copy has a unique, printable code. */
export interface BookCopy {
  id: number
  bookId: number
  copyNumber: number
  code: string
  status: CopyStatus
  acquiredAt: Date
}

export interface BookInput {
  title: string
  author: string
  isbn: string | null
  publishedYear: number | null
  description: string
}

export const MAX_COPIES_PER_BATCH = 100

/** Builds the shelf code printed on a copy's label, e.g. `BK-0007-003`. */
export function copyCode(bookId: number, copyNumber: number): string {
  return `BK-${String(bookId).padStart(4, '0')}-${String(copyNumber).padStart(3, '0')}`
}

/** Plans the next `quantity` copies for a book given its highest existing copy number. */
export function planNewCopies(bookId: number, highestCopyNumber: number, quantity: number) {
  return Array.from({ length: quantity }, (_, i) => {
    const copyNumber = highestCopyNumber + i + 1
    return { bookId, copyNumber, code: copyCode(bookId, copyNumber) }
  })
}
