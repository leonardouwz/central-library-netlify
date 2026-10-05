import { createFileRoute } from '@tanstack/react-router'
import { Plus, Repeat2 } from 'lucide-react'
import { useState } from 'react'
import type { LoanFilter } from '@/application/views'
import { NewLoanModal } from '@/components/forms'
import { LoanTable } from '@/components/library'
import { Button, Card, EmptyState, PageHeader, Segmented } from '@/components/ui'
import { LOAN_PERIOD_DAYS } from '@/domain/loan'
import { plural } from '@/lib/format'
import { listLoans } from '@/server/loans.functions'

const filters: { value: LoanFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Checked out' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'returned', label: 'Returned' },
]

const emptyCopy: Record<LoanFilter, string> = {
  all: 'No loans have been processed yet.',
  active: 'No books are checked out right now.',
  overdue: 'Nothing is overdue. Every loan is on schedule.',
  returned: 'No books have been returned yet.',
}

export const Route = createFileRoute('/loans')({
  validateSearch: (search: Record<string, unknown>): { filter?: LoanFilter } => ({
    filter: filters.some((f) => f.value === search.filter) && search.filter !== 'all' ? (search.filter as LoanFilter) : undefined,
  }),
  loaderDeps: ({ search }) => ({ filter: search.filter ?? 'all' }),
  loader: ({ deps }) => listLoans({ data: { filter: deps.filter } }),
  component: Loans,
})

function Loans() {
  const loans = Route.useLoaderData()
  const { filter = 'all' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <PageHeader eyebrow="Circulation" title="Loans">
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> New loan
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          options={filters}
          onChange={(v) => navigate({ search: { filter: v === 'all' ? undefined : v }, replace: true })}
        />
        <p className="text-sm text-ink-soft">
          {plural(loans.length, 'loan')} · {LOAN_PERIOD_DAYS}-day period
        </p>
      </div>

      {loans.length === 0 ? (
        <EmptyState icon={<Repeat2 className="h-6 w-6" />} title="Nothing to show">
          {emptyCopy[filter]}
        </EmptyState>
      ) : (
        <Card className="rise overflow-hidden">
          <LoanTable loans={loans} />
        </Card>
      )}

      <NewLoanModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
