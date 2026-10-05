import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Layers, Pencil, Repeat2, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BookFormModal, NewLoanModal } from '@/components/forms'
import { ShelfCode } from '@/components/library'
import { Badge, Button, Card, EmptyState, ErrorNote, Input, Table, Td, Th } from '@/components/ui'
import { MAX_COPIES_PER_BATCH } from '@/domain/book'
import { formatDate, plural, relativeDays } from '@/lib/format'
import { useAction } from '@/lib/use-action'
import { addStock, deleteBook, getBook } from '@/server/books.functions'

export const Route = createFileRoute('/books/$bookId')({
  loader: ({ params }) => getBook({ data: { id: Number(params.bookId) } }),
  component: BookPage,
})

function AddStock({ bookId }: { bookId: number }) {
  const { run, pending, error } = useAction(addStock)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState<string[] | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const res = await run({ data: { bookId, quantity } })
    if (res.ok) {
      setAdded(res.value.map((c) => c.code))
      setQuantity(1)
    }
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        <Layers className="h-5 w-5 text-brass" /> Add stock
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Each new unit becomes a physical copy with its own shelf code.</p>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <Input
          type="number"
          min={1}
          max={MAX_COPIES_PER_BATCH}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-24"
          aria-label="Number of copies"
        />
        <Button type="submit" disabled={pending || quantity < 1} className="flex-1">
          {pending ? 'Generating…' : `Generate ${plural(quantity || 0, 'copy', 'copies')}`}
        </Button>
      </form>
      <div className="mt-3">
        <ErrorNote message={error} />
      </div>
      {added && (
        <div className="fade mt-2 rounded-lg bg-moss-soft px-3 py-2 text-sm text-moss">
          Added {added.length === 1 ? added[0] : `${added[0]} → ${added[added.length - 1]}`}
        </div>
      )}
    </Card>
  )
}

function BookPage() {
  const book = Route.useLoaderData()
  const navigate = useNavigate()
  const [modal, setModal] = useState<'edit' | 'loan' | null>(null)
  const remove = useAction(deleteBook)
  const onLoan = book.totalCopies - book.availableCopies

  async function onDelete() {
    if (!confirm(`Delete “${book.title}” and all ${plural(book.totalCopies, 'copy', 'copies')}? This cannot be undone.`)) return
    const res = await remove.run({ data: { id: book.id } })
    if (res.ok) navigate({ to: '/books' })
  }

  return (
    <div>
      <Link to="/books" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Catalog
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rise ruled relative overflow-hidden rounded-3xl border border-rule bg-card p-7 sm:p-9">
            <div className="absolute right-6 top-6 font-mono text-[11px] text-ink-soft/70">No. {String(book.id).padStart(4, '0')}</div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
              {book.publishedYear ?? 'Undated'} {book.isbn && `· ISBN ${book.isbn}`}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{book.title}</h1>
            <p className="mt-1 text-lg italic text-ink-soft">by {book.author}</p>
            {book.description && <p className="mt-5 max-w-2xl leading-relaxed text-ink/85">{book.description}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => setModal('loan')} disabled={book.availableCopies === 0}>
                <Repeat2 className="h-4 w-4" /> Lend a copy
              </Button>
              <Button variant="secondary" onClick={() => setModal('edit')}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="danger"
                onClick={onDelete}
                disabled={remove.pending || book.hasLoanHistory}
                title={book.hasLoanHistory ? 'Books with loan history are kept for the record' : undefined}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
            <div className="mt-3 max-w-md">
              <ErrorNote message={remove.error} />
            </div>
          </section>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <h2 className="font-display text-xl font-semibold">Copies</h2>
              <p className="text-sm text-ink-soft">
                {book.availableCopies} on shelf · {onLoan} on loan
              </p>
            </div>
            {book.copies.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Layers className="h-6 w-6" />} title="No physical copies yet">
                  Use “Add stock” to generate copies that members can borrow.
                </EmptyState>
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Shelf code</Th>
                    <Th>Acquired</Th>
                    <Th>Status</Th>
                    <Th>Borrower</Th>
                  </tr>
                </thead>
                <tbody>
                  {book.copies.map((copy) => (
                    <tr key={copy.id}>
                      <Td>
                        <ShelfCode code={copy.code} />
                      </Td>
                      <Td className="text-ink-soft">{formatDate(copy.acquiredAt)}</Td>
                      <Td>{copy.status === 'AVAILABLE' ? <Badge tone="moss">On shelf</Badge> : <Badge tone="brass">On loan</Badge>}</Td>
                      <Td>
                        {copy.borrower ? (
                          <div>
                            <Link to="/users/$userId" params={{ userId: String(copy.borrower.userId) }} className="font-medium hover:text-moss">
                              {copy.borrower.userName}
                            </Link>
                            <div className="text-xs text-ink-soft">due {relativeDays(copy.borrower.dueAt)}</div>
                          </div>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <AddStock bookId={book.id} />
          <Card className="p-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Availability</p>
            <p className="mt-2 font-display text-5xl font-semibold text-moss">
              {book.availableCopies}
              <span className="text-2xl text-ink-soft">/{book.totalCopies}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-deep">
              <div
                className="h-full rounded-full bg-moss transition-all"
                style={{ width: `${book.totalCopies ? (book.availableCopies / book.totalCopies) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-ink-soft">copies ready to lend</p>
          </Card>
        </aside>
      </div>

      <BookFormModal open={modal === 'edit'} onClose={() => setModal(null)} book={book} />
      <NewLoanModal open={modal === 'loan'} onClose={() => setModal(null)} defaultBookId={book.id} />
    </div>
  )
}
