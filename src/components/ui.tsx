import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-moss text-paper hover:bg-moss-deep shadow-[0_1px_0_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.12)]',
  secondary: 'bg-card text-ink border border-rule hover:border-ink-soft/50 hover:bg-paper',
  ghost: 'text-ink-soft hover:text-ink hover:bg-paper-deep/70',
  danger: 'bg-card text-oxblood border border-oxblood/30 hover:bg-oxblood-soft',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:translate-y-px disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

const fieldBase =
  'w-full rounded-lg border border-rule bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 transition focus:border-moss focus:outline-none focus:ring-3 focus:ring-moss/15'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-24 resize-y', className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, 'appearance-auto', className)} {...props} />
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="fade rounded-lg border border-oxblood/25 bg-oxblood-soft px-3 py-2 text-sm text-oxblood">
      {message}
    </p>
  )
}

type Tone = 'moss' | 'brass' | 'oxblood' | 'neutral'
const tones: Record<Tone, string> = {
  moss: 'bg-moss-soft text-moss',
  brass: 'bg-brass-soft text-[#7a5616]',
  oxblood: 'bg-oxblood-soft text-oxblood',
  neutral: 'bg-paper-deep text-ink-soft',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider', tones[tone])}>
      {children}
    </span>
  )
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="rise mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
      <div>
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-brass">{eyebrow}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('rounded-2xl border border-rule bg-card shadow-[0_1px_0_rgb(29_38_33/0.04),0_12px_30px_-18px_rgb(29_38_33/0.25)]', className)}>
      {children}
    </section>
  )
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="ruled rounded-2xl border border-dashed border-rule bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-paper-deep text-brass">{icon}</div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {children && <div className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{children}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fade fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise w-full max-w-lg rounded-2xl border border-rule bg-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-soft hover:bg-paper-deep hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/** Horizontal segmented filter used on list screens. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-rule bg-paper-deep/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer',
            value === o.value ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-soft', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm [&_tbody_tr]:border-t [&_tbody_tr]:border-rule/70 [&_tbody_tr:hover]:bg-paper/60">
        {children}
      </table>
    </div>
  )
}
