import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { UserFormModal } from '@/components/forms'
import { UserStatusBadge } from '@/components/library'
import { SearchBox } from '@/components/SearchBox'
import { Button, Card, EmptyState, PageHeader, Table, Td, Th } from '@/components/ui'
import { formatDate, formatMoney, plural } from '@/lib/format'
import { listUsers } from '@/server/users.functions'

export const Route = createFileRoute('/users/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => listUsers({ data: { search: deps.q } }),
  component: Members,
})

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function Members() {
  const users = Route.useLoaderData()
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <PageHeader eyebrow="Members" title="Library members">
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Register member
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={q ?? ''} onChange={(v) => navigate({ search: { q: v || undefined }, replace: true })} placeholder="Search name or email" />
        <p className="text-sm text-ink-soft">{plural(users.length, 'member')}</p>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title={q ? 'No members match' : 'No members yet'}>
          {q ? 'Try another name or email.' : 'Register your first member to start lending.'}
        </EmptyState>
      ) : (
        <Card className="rise overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Status</Th>
                <Th>Loans out</Th>
                <Th>Unpaid debts</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <Link to="/users/$userId" params={{ userId: String(user.id) }} className="group flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-deep font-display text-sm font-semibold text-moss ring-1 ring-rule">
                        {initials(user.name)}
                      </span>
                      <span>
                        <span className="block font-medium group-hover:text-moss">{user.name}</span>
                        <span className="block text-xs text-ink-soft">{user.email}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <UserStatusBadge status={user.status} />
                  </Td>
                  <Td>{user.activeLoans}</Td>
                  <Td className={user.unpaidDebtCents > 0 ? 'font-semibold text-oxblood' : 'text-ink-soft'}>
                    {user.unpaidDebtCents > 0 ? formatMoney(user.unpaidDebtCents) : '—'}
                  </Td>
                  <Td className="text-ink-soft">{formatDate(user.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <UserFormModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
