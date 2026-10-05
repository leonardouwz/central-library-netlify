import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, HandCoins, Mail, Pencil, Phone, Power, Repeat2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { NewLoanModal, UserFormModal } from '@/components/forms'
import { DebtTable, LoanTable, UserStatusBadge } from '@/components/library'
import { Button, Card, ErrorNote, cn } from '@/components/ui'
import { formatDate, formatMoney, plural } from '@/lib/format'
import { useAction } from '@/lib/use-action'
import { deleteUser, getUser, setUserStatus } from '@/server/users.functions'

export const Route = createFileRoute('/users/$userId')({
  loader: ({ params }) => getUser({ data: { id: Number(params.userId) } }),
  component: MemberPage,
})

function MemberPage() {
  const user = Route.useLoaderData()
  const navigate = useNavigate()
  const [modal, setModal] = useState<'edit' | 'loan' | null>(null)
  const status = useAction(setUserStatus)
  const remove = useAction(deleteUser)
  const unpaid = user.debts.filter((d) => !d.paidAt)
  const canBorrow = user.status === 'ACTIVE' && user.unpaidDebtCents === 0
  const reason =
    user.status !== 'ACTIVE'
      ? 'Inactive members cannot borrow.'
      : user.unpaidDebtCents > 0
        ? `Blocked until ${formatMoney(user.unpaidDebtCents)} in debts is paid.`
        : 'In good standing — may borrow.'

  async function onDelete() {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
    const res = await remove.run({ data: { id: user.id } })
    if (res.ok) navigate({ to: '/users' })
  }

  return (
    <div>
      <Link to="/users" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Members
      </Link>

      <section className="rise mb-6 grid gap-6 rounded-3xl border border-rule bg-card p-7 sm:p-9 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-3">
            <UserStatusBadge status={user.status} />
            <span className="font-mono text-[11px] text-ink-soft">Member since {formatDate(user.createdAt)}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{user.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {user.email}
            </span>
            {user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {user.phone}
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setModal('loan')} disabled={!canBorrow}>
              <Repeat2 className="h-4 w-4" /> New loan
            </Button>
            <Button variant="secondary" onClick={() => setModal('edit')}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="secondary"
              disabled={status.pending}
              onClick={() => status.run({ data: { id: user.id, status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } })}
            >
              <Power className="h-4 w-4" />
              {user.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
            </Button>
            <Button
              variant="danger"
              onClick={onDelete}
              disabled={remove.pending || user.hasHistory}
              title={user.hasHistory ? 'Members with loan history are kept; deactivate instead' : undefined}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
          <div className="mt-3 max-w-md space-y-2">
            <ErrorNote message={status.error} />
            <ErrorNote message={remove.error} />
          </div>
        </div>

        <div className="grid min-w-64 grid-cols-2 gap-3 self-start lg:grid-cols-1">
          <div className="rounded-2xl border border-rule bg-paper p-4">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Loans out</p>
            <p className="mt-1 font-display text-3xl font-semibold">{user.activeLoans}</p>
          </div>
          <div className={cn('rounded-2xl border p-4', user.unpaidDebtCents > 0 ? 'border-oxblood/30 bg-oxblood-soft/50' : 'border-rule bg-paper')}>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Owes</p>
            <p className={cn('mt-1 font-display text-3xl font-semibold', user.unpaidDebtCents > 0 && 'text-oxblood')}>
              {formatMoney(user.unpaidDebtCents)}
            </p>
          </div>
          <p className={cn('col-span-2 text-sm lg:col-span-1', canBorrow ? 'text-moss' : 'text-oxblood')}>{reason}</p>
        </div>
      </section>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Repeat2 className="h-5 w-5 text-moss" /> Active loans
            </h2>
            <span className="text-sm text-ink-soft">{plural(user.loans.length, 'book')} checked out</span>
          </div>
          {user.loans.length ? (
            <LoanTable loans={user.loans} showUser={false} />
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">No books currently checked out.</p>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <HandCoins className="h-5 w-5 text-brass" /> Debts
            </h2>
            <span className="text-sm text-ink-soft">
              {unpaid.length ? `${plural(unpaid.length, 'unpaid debt')}` : 'All settled'}
            </span>
          </div>
          {user.debts.length ? (
            <DebtTable debts={user.debts} showUser={false} />
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">No late fees on record.</p>
          )}
        </Card>
      </div>

      <UserFormModal open={modal === 'edit'} onClose={() => setModal(null)} user={user} />
      <NewLoanModal open={modal === 'loan'} onClose={() => setModal(null)} defaultUserId={user.id} />
    </div>
  )
}
