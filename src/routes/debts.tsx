import { createFileRoute } from '@tanstack/react-router'
import { HandCoins } from 'lucide-react'
import type { DebtFilter } from '@/application/views'
import { DebtTable } from '@/components/library'
import { Card, EmptyState, PageHeader, Segmented } from '@/components/ui'
import { DAILY_LATE_FEE_CENTS } from '@/domain/debt'
import { formatMoney, plural } from '@/lib/format'
import { listDebts } from '@/server/debts.functions'

const filters: { value: DebtFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
]

export const Route = createFileRoute('/debts')({
  validateSearch: (search: Record<string, unknown>): { filter?: DebtFilter } => ({
    filter: search.filter === 'unpaid' || search.filter === 'paid' ? search.filter : undefined,
  }),
  loaderDeps: ({ search }) => ({ filter: search.filter ?? 'all' }),
  loader: ({ deps }) => listDebts({ data: { filter: deps.filter } }),
  component: Debts,
})

function Debts() {
  const debts = Route.useLoaderData()
  const { filter = 'all' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const outstanding = debts.filter((d) => !d.paidAt).reduce((sum, d) => sum + d.amountCents, 0)

  return (
    <div>
      <PageHeader eyebrow="Late fees" title="Debts">
        <div className="text-right">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Outstanding in view</p>
          <p className="font-display text-3xl font-semibold text-oxblood">{formatMoney(outstanding)}</p>
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          options={filters}
          onChange={(v) => navigate({ search: { filter: v === 'all' ? undefined : v }, replace: true })}
        />
        <p className="text-sm text-ink-soft">
          {plural(debts.length, 'debt')} · {formatMoney(DAILY_LATE_FEE_CENTS)} per day late
        </p>
      </div>

      {debts.length === 0 ? (
        <EmptyState icon={<HandCoins className="h-6 w-6" />} title="No debts here">
          Debts are created automatically when a book is returned after its due date.
        </EmptyState>
      ) : (
        <Card className="rise overflow-hidden">
          <DebtTable debts={debts} />
        </Card>
      )}
    </div>
  )
}
