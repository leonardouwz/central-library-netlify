import { useRouter } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

/**
 * Wraps a mutating server function: tracks pending/error state and refreshes
 * route loaders after success so every screen reflects the change.
 */
export function useAction<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: TArgs): Promise<{ ok: true; value: TResult } | { ok: false }> => {
      setPending(true)
      setError(null)
      try {
        const result = await action(...args)
        await router.invalidate()
        return { ok: true, value: result }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
        return { ok: false }
      } finally {
        setPending(false)
      }
    },
    [action, router],
  )

  return { run, pending, error, clearError: () => setError(null) }
}
