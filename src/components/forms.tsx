import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import type { BookSummary, UserSummary } from '@/application/views'
import { LOAN_PERIOD_DAYS, computeDueDate } from '@/domain/loan'
import { formatDate, formatMoney } from '@/lib/format'
import { useAction } from '@/lib/use-action'
import { createBook, listBooks, updateBook } from '@/server/books.functions'
import { checkoutBook } from '@/server/loans.functions'
import { createUser, listUsers, updateUser } from '@/server/users.functions'
import { Button, ErrorNote, Field, Input, Modal, Select, Textarea } from './ui'

export function BookFormModal({
  open,
  onClose,
  book,
}: {
  open: boolean
  onClose: () => void
  book?: BookSummary
}) {
  const navigate = useNavigate()
  const create = useAction(createBook)
  const update = useAction(updateBook)
  const action = book ? update : create
  const close = () => {
    create.clearError()
    update.clearError()
    onClose()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const year = String(f.get('publishedYear') ?? '').trim()
    const input = {
      title: String(f.get('title') ?? ''),
      author: String(f.get('author') ?? ''),
      isbn: String(f.get('isbn') ?? '') || null,
      publishedYear: year ? Number(year) : null,
      description: String(f.get('description') ?? ''),
    }
    if (book) {
      const res = await update.run({ data: { id: book.id, ...input } })
      if (res.ok) close()
    } else {
      const res = await create.run({ data: { ...input, initialCopies: Number(f.get('initialCopies') ?? 0) } })
      if (res.ok) {
        close()
        navigate({ to: '/books/$bookId', params: { bookId: String(res.value.id) } })
      }
    }
  }

  return (
    <Modal open={open} onClose={close} title={book ? 'Edit book' : 'Add a book to the catalog'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Title">
          <Input name="title" required defaultValue={book?.title} placeholder="The Left Hand of Darkness" autoFocus />
        </Field>
        <Field label="Author">
          <Input name="author" required defaultValue={book?.author} placeholder="Ursula K. Le Guin" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ISBN" hint="Optional, must be unique">
            <Input name="isbn" defaultValue={book?.isbn ?? ''} placeholder="9780441478125" />
          </Field>
          <Field label="Published">
            <Input name="publishedYear" type="number" min={0} max={3000} defaultValue={book?.publishedYear ?? ''} placeholder="1969" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea name="description" defaultValue={book?.description} placeholder="A short summary for the catalog card…" />
        </Field>
        {!book && (
          <Field label="Initial copies" hint="Each copy gets its own shelf code. You can add more stock later.">
            <Input name="initialCopies" type="number" min={0} max={100} defaultValue={1} />
          </Field>
        )}
        <ErrorNote message={action.error} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={action.pending}>
            {action.pending ? 'Saving…' : book ? 'Save changes' : 'Add book'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function UserFormModal({
  open,
  onClose,
  user,
}: {
  open: boolean
  onClose: () => void
  user?: UserSummary
}) {
  const navigate = useNavigate()
  const create = useAction(createUser)
  const update = useAction(updateUser)
  const action = user ? update : create
  const close = () => {
    create.clearError()
    update.clearError()
    onClose()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const input = {
      name: String(f.get('name') ?? ''),
      email: String(f.get('email') ?? ''),
      phone: String(f.get('phone') ?? '') || null,
    }
    if (user) {
      const res = await update.run({ data: { id: user.id, ...input } })
      if (res.ok) close()
    } else {
      const res = await create.run({ data: input })
      if (res.ok) {
        close()
        navigate({ to: '/users/$userId', params: { userId: String(res.value.id) } })
      }
    }
  }

  return (
    <Modal open={open} onClose={close} title={user ? 'Edit member' : 'Register a member'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input name="name" required defaultValue={user?.name} placeholder="Grace Hopper" autoFocus />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required defaultValue={user?.email} placeholder="grace@example.com" />
        </Field>
        <Field label="Phone" hint="Optional">
          <Input name="phone" defaultValue={user?.phone ?? ''} placeholder="+1 555 0100" />
        </Field>
        <ErrorNote message={action.error} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={action.pending}>
            {action.pending ? 'Saving…' : user ? 'Save changes' : 'Register member'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Checkout desk: pick a member and a title; the next available copy is
 * assigned automatically. Eligibility is enforced server-side, but the form
 * flags problems up front.
 */
export function NewLoanModal({
  open,
  onClose,
  defaultUserId,
  defaultBookId,
}: {
  open: boolean
  onClose: () => void
  defaultUserId?: number
  defaultBookId?: number
}) {
  const [users, setUsers] = useState<UserSummary[] | null>(null)
  const [books, setBooks] = useState<BookSummary[] | null>(null)
  const [userId, setUserId] = useState<string>(defaultUserId ? String(defaultUserId) : '')
  const [bookId, setBookId] = useState<string>(defaultBookId ? String(defaultBookId) : '')
  const checkout = useAction(checkoutBook)

  useEffect(() => {
    if (!open) return
    setUserId(defaultUserId ? String(defaultUserId) : '')
    setBookId(defaultBookId ? String(defaultBookId) : '')
    checkout.clearError()
    Promise.all([listUsers({ data: {} }), listBooks({ data: {} })]).then(([u, b]) => {
      setUsers(u)
      setBooks(b)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultUserId, defaultBookId])

  const user = users?.find((u) => String(u.id) === userId)
  const book = books?.find((b) => String(b.id) === bookId)
  const blocker =
    user?.status === 'INACTIVE'
      ? `${user.name} is inactive and cannot borrow.`
      : user && user.unpaidDebtCents > 0
        ? `${user.name} owes ${formatMoney(user.unpaidDebtCents)} and must settle before borrowing.`
        : book && book.availableCopies === 0
          ? `All copies of “${book.title}” are currently out.`
          : null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const res = await checkout.run({ data: { userId: Number(userId), bookId: Number(bookId) } })
    if (res.ok) onClose()
  }

  const loading = !users || !books

  return (
    <Modal open={open} onClose={onClose} title="New loan">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Member">
          <Select value={userId} onChange={(e) => setUserId(e.target.value)} required disabled={loading}>
            <option value="">{loading ? 'Loading members…' : 'Choose a member'}</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email}
                {u.status === 'INACTIVE' ? ' (inactive)' : u.unpaidDebtCents > 0 ? ' (has debts)' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Book">
          <Select value={bookId} onChange={(e) => setBookId(e.target.value)} required disabled={loading}>
            <option value="">{loading ? 'Loading catalog…' : 'Choose a title'}</option>
            {books?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author} ({b.availableCopies}/{b.totalCopies} available)
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-xl border border-rule bg-paper px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Loan period</span>
            <span className="font-medium">{LOAN_PERIOD_DAYS} days</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-soft">Due back</span>
            <span className="font-display text-lg font-semibold">{formatDate(computeDueDate(new Date()).toISOString())}</span>
          </div>
        </div>

        {blocker && !checkout.error && (
          <p className="rounded-lg border border-brass/40 bg-brass-soft px-3 py-2 text-sm text-[#6b4b12]">{blocker}</p>
        )}
        <ErrorNote message={checkout.error} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={checkout.pending || !userId || !bookId || !!blocker}>
            {checkout.pending ? 'Checking out…' : 'Check out'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
