import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from './ui'

/** Debounced search input that reports its value after the user pauses typing. */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return
    const t = setTimeout(() => onChange(text), 250)
    return () => clearTimeout(t)
  }, [text, value, onChange])

  return (
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="pl-9" type="search" />
    </div>
  )
}
