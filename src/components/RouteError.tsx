import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import { Button, EmptyState } from './ui'

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <EmptyState icon={<TriangleAlert className="h-6 w-6" />} title="Something went wrong">
      <p className="mb-4">{error instanceof Error ? error.message : 'Unexpected error.'}</p>
      <Button variant="secondary" onClick={() => router.invalidate()}>
        Try again
      </Button>
    </EmptyState>
  )
}
