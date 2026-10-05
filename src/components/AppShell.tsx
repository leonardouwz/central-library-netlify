import { Link } from '@tanstack/react-router'
import { BookMarked, HandCoins, LayoutDashboard, Library, Menu, Repeat2, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from './ui'

const nav = [
  { to: '/', label: 'Front desk', icon: LayoutDashboard, exact: true },
  { to: '/books', label: 'Catalog', icon: BookMarked },
  { to: '/users', label: 'Members', icon: Users },
  { to: '/loans', label: 'Loans', icon: Repeat2 },
  { to: '/debts', label: 'Debts', icon: HandCoins },
] as const

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-moss text-brass-soft shadow-inner">
        <Library className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-2xl font-semibold tracking-tight">Stacks</span>
        <span className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-soft">Library desk</span>
      </span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: 'exact' in item }}
          className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper-deep/80 hover:text-ink"
          activeProps={{ className: '!bg-card !text-ink shadow-sm ring-1 ring-rule' }}
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-brass transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'text-moss' : 'text-ink-soft/80')} />
              {item.label}
            </>
          )}
        </Link>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative z-10 min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-rule bg-paper-deep/40 px-4 py-6 lg:flex">
        <div className="space-y-9">
          <div className="px-2">
            <Logo />
          </div>
          <NavLinks />
        </div>
        <div className="mx-2 rounded-xl border border-rule bg-card/70 p-4 text-xs leading-relaxed text-ink-soft">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brass">House rules</p>
          Loans run 14 days. Late returns accrue a daily fee, and members with unpaid debts can't borrow.
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-rule bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-paper-deep" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fade fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 bg-paper p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-paper-deep" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</main>
    </div>
  )
}
