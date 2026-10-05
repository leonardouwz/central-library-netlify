import { Link, createFileRoute } from '@tanstack/react-router'
import { AlarmClock, ArrowRight, BookCopy, BookPlus, HandCoins, Plus, Repeat2, UserPlus, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BookFormModal, NewLoanModal, UserFormModal } from '@/components/forms'
import { LoanTable } from '@/components/library'
import { Button, Card, EmptyState, cn } from '@/components/ui'
import { DAILY_LATE_FEE_CENTS } from '@/domain/debt'
import { LOAN_PERIOD_DAYS } from '@/domain/loan'
import { formatMoney, plural } from '@/lib/format'
import { getOverview } from '@/server/dashboard.functions'

export const Route = createFileRoute('/')({
  loader: () => getOverview(),
  component: FrontDesk,
})

function Stat({
  label,
  value,
  detail,
  icon,
  tone = 'default',
  delay,
  to,
}: {
  label: string
  value: ReactNode
  detail: string
  icon: ReactNode
  tone?: 'default' | 'alert'
  delay: number
  to: '/books' | '/users' | '/loans' | '/debts'
}) {
  return (
    <Link
      to={to}
      className={cn(
        'rise group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg',
        tone === 'alert' ? 'border-oxblood/30' : 'border-rule',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
        <span className={cn('rounded-lg p-2', tone === 'alert' ? 'bg-oxblood-soft text-oxblood' : 'bg-paper-deep text-moss')}>
          {icon}
        </span>
      </div>
      <p className={cn('mt-3 font-display text-4xl font-semibold tracking-tight', tone === 'alert' && 'text-oxblood')}>{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{detail}</p>
    </Link>
  )
}

function FrontDesk() {
  const { stats, overdue, recent } = Route.useLoaderData()
  const [modal, setModal] = useState<'loan' | 'book' | 'user' | null>(null)
  const close = () => setModal(null)
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div>
      <section className="rise ruled relative mb-10 overflow-hidden rounded-3xl border border-rule bg-card px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute inset-y-0 left-8 w-px bg-oxblood/25 sm:left-14" aria-hidden />
        <div className="relative pl-6 sm:pl-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">{today}</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Good to see you at the <em className="font-normal italic text-moss">front desk.</em>
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            {stats.overdueLoans > 0
              ? `${plural(stats.overdueLoans, 'loan')} ${stats.overdueLoans === 1 ? 'is' : 'are'} past due and ${formatMoney(stats.unpaidDebtCents)} in late fees is outstanding.`
              : 'Every loan is on schedule. Check out a book, register a member, or grow the collection.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setModal('loan')}>
              <Repeat2 className="h-4 w-4" /> New loan
            </Button>
            <Button variant="secondary" onClick={() => setModal('book')}>
              <BookPlus className="h-4 w-4" /> Add book
            </Button>
            <Button variant="secondary" onClick={() => setModal('user')}>
              <UserPlus className="h-4 w-4" /> Register member
            </Button>
          </div>
        </div>
      </section>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          to="/books"
          delay={60}
          label="Collection"
          value={stats.copies}
          detail={`${stats.availableCopies} on the shelf · ${plural(stats.titles, 'title')}`}
          icon={<BookCopy className="h-4 w-4" />}
        />
        <Stat
          to="/loans"
          delay={120}
          label="Out on loan"
          value={stats.activeLoans}
          detail={`${LOAN_PERIOD_DAYS}-day standard period`}
          icon={<Repeat2 className="h-4 w-4" />}
        />
        <Stat
          to="/loans"
          delay={180}
          label="Overdue"
          value={stats.overdueLoans}
          detail={`${formatMoney(DAILY_LATE_FEE_CENTS)} per day once returned`}
          icon={<AlarmClock className="h-4 w-4" />}
          tone={stats.overdueLoans > 0 ? 'alert' : 'default'}
        />
        <Stat
          to="/debts"
          delay={240}
          label="Unpaid debts"
          value={formatMoney(stats.unpaidDebtCents)}
          detail={`${plural(stats.unpaidDebtCount, 'open debt')} · ${stats.activeUsers}/${stats.totalUsers} members active`}
          icon={<HandCoins className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rise overflow-hidden [animation-delay:300ms]">
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <AlarmClock className="h-5 w-5 text-oxblood" /> Past due
            </h2>
            <Link to="/loans" search={{ filter: 'overdue' }} className="flex items-center gap-1 text-sm text-moss hover:underline">
              All overdue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {overdue.length ? (
            <LoanTable loans={overdue} />
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">Nothing overdue. The shelves are in good order.</p>
          )}
        </Card>

        <Card className="rise overflow-hidden [animation-delay:360ms]">
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Repeat2 className="h-5 w-5 text-moss" /> Latest activity
            </h2>
            <Link to="/loans" className="flex items-center gap-1 text-sm text-moss hover:underline">
              All loans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.length ? (
            <LoanTable loans={recent} />
          ) : (
            <div className="p-5">
              <EmptyState icon={<Users className="h-6 w-6" />} title="No loans yet">
                Add a book with a few copies and register a member, then check out your first loan.
                <div className="mt-4">
                  <Button size="sm" onClick={() => setModal('loan')}>
                    <Plus className="h-3.5 w-3.5" /> New loan
                  </Button>
                </div>
              </EmptyState>
            </div>
          )}
        </Card>
      </div>

      <NewLoanModal open={modal === 'loan'} onClose={close} />
      <BookFormModal open={modal === 'book'} onClose={close} />
      <UserFormModal open={modal === 'user'} onClose={close} />
    </div>
  )
}
