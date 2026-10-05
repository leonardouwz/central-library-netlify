import { Link } from '@tanstack/react-router'
import { CheckCircle2, CornerDownLeft } from 'lucide-react'
import { useState } from 'react'
import type { DebtView, LoanView } from '@/application/views'
import type { LoanStatus } from '@/domain/loan'
import type { UserStatus } from '@/domain/user'
import { formatDate, formatMoney, plural, relativeDays } from '@/lib/format'
import { useAction } from '@/lib/use-action'
import { payDebt } from '@/server/debts.functions'
import { returnLoan } from '@/server/loans.functions'
import { Badge, Button, Table, Td, Th } from './ui'

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  if (status === 'OVERDUE') return <Badge tone="oxblood">Overdue</Badge>
  if (status === 'RETURNED') return <Badge>Returned</Badge>
  return <Badge tone="moss">On loan</Badge>
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return status === 'ACTIVE' ? <Badge tone="moss">Active</Badge> : <Badge>Inactive</Badge>
}

export function ShelfCode({ code }: { code: string }) {
  return (
    <span className="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-ink-soft">
      {code}
    </span>
  )
}

function DueCell({ loan }: { loan: LoanView }) {
  if (loan.returnedAt) {
    return (
      <div>
        <div>{formatDate(loan.returnedAt)}</div>
        <div className="text-xs text-ink-soft">
          {loan.daysOverdue > 0 ? `returned ${plural(loan.daysOverdue, 'day')} late` : 'returned on time'}
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className={loan.status === 'OVERDUE' ? 'font-medium text-oxblood' : ''}>{formatDate(loan.dueAt)}</div>
      <div className={loan.status === 'OVERDUE' ? 'text-xs text-oxblood/80' : 'text-xs text-ink-soft'}>
        {loan.status === 'OVERDUE' ? `${plural(loan.daysOverdue, 'day')} overdue` : `due ${relativeDays(loan.dueAt)}`}
      </div>
    </div>
  )
}

/** Shows the fee a return triggered so staff can tell the member immediately. */
export function ReturnButton({ loan, onReturned }: { loan: LoanView; onReturned?: (debt: DebtView | null) => void }) {
  const { run, pending, error } = useAction(returnLoan)
  if (loan.returnedAt) return null
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          const res = await run({ data: { id: loan.id } })
          if (res.ok) onReturned?.(res.value.debt)
        }}
      >
        <CornerDownLeft className="h-3.5 w-3.5" />
        {pending ? 'Returning…' : 'Return'}
      </Button>
      {error && <span className="max-w-48 text-right text-xs text-oxblood">{error}</span>}
    </div>
  )
}

export function LoanTable({ loans, showUser = true }: { loans: LoanView[]; showUser?: boolean }) {
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <>
      {notice && (
        <div className="fade mx-4 mt-4 rounded-lg border border-brass/40 bg-brass-soft px-3 py-2 text-sm text-[#6b4b12]">
          {notice}
        </div>
      )}
      <Table>
        <thead>
          <tr>
            <Th>Book</Th>
            {showUser && <Th>Member</Th>}
            <Th>Loaned</Th>
            <Th>Due / returned</Th>
            <Th>Status</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id} className={loan.status === 'OVERDUE' ? 'bg-oxblood-soft/30' : ''}>
              <Td>
                <Link to="/books/$bookId" params={{ bookId: String(loan.book.id) }} className="font-medium hover:text-moss">
                  {loan.book.title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                  <ShelfCode code={loan.copy.code} />
                  <span className="truncate">{loan.book.author}</span>
                </div>
              </Td>
              {showUser && (
                <Td>
                  <Link to="/users/$userId" params={{ userId: String(loan.user.id) }} className="hover:text-moss">
                    {loan.user.name}
                  </Link>
                  <div className="text-xs text-ink-soft">{loan.user.email}</div>
                </Td>
              )}
              <Td className="whitespace-nowrap">{formatDate(loan.loanedAt)}</Td>
              <Td className="whitespace-nowrap">
                <DueCell loan={loan} />
              </Td>
              <Td>
                <LoanStatusBadge status={loan.status} />
              </Td>
              <Td className="text-right">
                <ReturnButton
                  loan={loan}
                  onReturned={(debt) =>
                    setNotice(
                      debt
                        ? `“${loan.book.title}” returned ${plural(debt.daysLate, 'day')} late — a debt of ${formatMoney(debt.amountCents)} was added for ${loan.user.name}.`
                        : `“${loan.book.title}” returned on time. Thanks!`,
                    )
                  }
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )
}

function PayButton({ debt }: { debt: DebtView }) {
  const { run, pending, error } = useAction(payDebt)
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" disabled={pending} onClick={() => run({ data: { id: debt.id } })}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        {pending ? 'Saving…' : 'Mark paid'}
      </Button>
      {error && <span className="text-xs text-oxblood">{error}</span>}
    </div>
  )
}

export function DebtTable({ debts, showUser = true }: { debts: DebtView[]; showUser?: boolean }) {
  return (
    <Table>
      <thead>
        <tr>
          {showUser && <Th>Member</Th>}
          <Th>Late return</Th>
          <Th>Charge</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th className="text-right">Action</Th>
        </tr>
      </thead>
      <tbody>
        {debts.map((debt) => (
          <tr key={debt.id}>
            {showUser && (
              <Td>
                <Link to="/users/$userId" params={{ userId: String(debt.user.id) }} className="font-medium hover:text-moss">
                  {debt.user.name}
                </Link>
              </Td>
            )}
            <Td>
              <Link to="/books/$bookId" params={{ bookId: String(debt.book.id) }} className="hover:text-moss">
                {debt.book.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                <ShelfCode code={debt.copyCode} /> {formatDate(debt.createdAt)}
              </div>
            </Td>
            <Td className="whitespace-nowrap text-ink-soft">
              {plural(debt.daysLate, 'day')} × {formatMoney(debt.dailyFeeCents)}
            </Td>
            <Td className="whitespace-nowrap font-display text-lg font-semibold">{formatMoney(debt.amountCents)}</Td>
            <Td>
              {debt.paidAt ? (
                <div>
                  <Badge tone="moss">Paid</Badge>
                  <div className="mt-1 text-xs text-ink-soft">{formatDate(debt.paidAt)}</div>
                </div>
              ) : (
                <Badge tone="brass">Unpaid</Badge>
              )}
            </Td>
            <Td className="text-right">{!debt.paidAt && <PayButton debt={debt} />}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

