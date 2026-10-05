import { Link, createFileRoute } from '@tanstack/react-router'
import { BookMarked, Plus } from 'lucide-react'
import { useState } from 'react'
import { BookFormModal } from '@/components/forms'
import { SearchBox } from '@/components/SearchBox'
import { Button, EmptyState, PageHeader, cn } from '@/components/ui'
import { plural } from '@/lib/format'
import { listBooks } from '@/server/books.functions'

export const Route = createFileRoute('/books/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => listBooks({ data: { search: deps.q } }),
  component: Catalog,
})

/** Stack of spines hinting at how many copies are on the shelf vs. out. */
function Spines({ total, available }: { total: number; available: number }) {
  const shown = Math.min(total, 12)
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={i}
          className={cn('w-[7px] rounded-t-[2px]', i < available ? 'bg-moss' : 'bg-rule')}
          style={{ height: `${70 + ((i * 37) % 30)}%` }}
        />
      ))}
      {total === 0 && <span className="text-xs italic text-ink-soft">no copies</span>}
    </div>
  )
}

function Catalog() {
  const books = Route.useLoaderData()
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="The collection">
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add book
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={q ?? ''} onChange={(v) => navigate({ search: { q: v || undefined }, replace: true })} placeholder="Search title, author or ISBN" />
        <p className="text-sm text-ink-soft">{plural(books.length, 'title')}</p>
      </div>

      {books.length === 0 ? (
        <EmptyState icon={<BookMarked className="h-6 w-6" />} title={q ? 'No matches on the shelves' : 'The catalog is empty'}>
          {q ? 'Try a different title, author or ISBN.' : 'Add your first title and generate copies for circulation.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {books.map((book, i) => (
            <Link
              key={book.id}
              to="/books/$bookId"
              params={{ bookId: String(book.id) }}
              className="rise group relative flex flex-col overflow-hidden rounded-2xl border border-rule bg-card p-5 transition hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-lg"
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-moss/80 transition group-hover:bg-brass" />
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
                {book.publishedYear ?? 'n.d.'} {book.isbn && `· ${book.isbn}`}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-semibold leading-tight group-hover:text-moss">{book.title}</h3>
              <p className="mt-0.5 text-sm italic text-ink-soft">{book.author}</p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <Spines total={book.totalCopies} available={book.availableCopies} />
                <p className="text-right text-sm">
                  <span className={cn('font-semibold', book.availableCopies === 0 && book.totalCopies > 0 ? 'text-oxblood' : 'text-moss')}>
                    {book.availableCopies}
                  </span>
                  <span className="text-ink-soft"> / {book.totalCopies} available</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BookFormModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
