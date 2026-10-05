const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const formatMoney = (cents: number) => money.format(cents / 100)
export const formatDate = (iso: string | null) => (iso ? date.format(new Date(iso)) : '—')

/** "in 3 days", "today", "5 days ago" relative to now, by calendar day. */
export function relativeDays(iso: string): string {
  const day = 86_400_000
  const start = (d: Date) => Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / day)
  const diff = start(new Date(iso)) - start(new Date())
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}

export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`
