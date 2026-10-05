import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/ui'
import { SearchX } from 'lucide-react'

import '../styles.css'

const siteName = 'Stacks — Library Desk'
const siteDescription = 'Manage your library catalog, members, loans and late-fee debts in one place.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: siteName },
      { name: 'description', content: siteDescription },
      { property: 'og:title', content: siteName },
      { property: 'og:description', content: siteDescription },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <EmptyState icon={<SearchX className="h-6 w-6" />} title="This shelf is empty">
      We couldn't find that page.{' '}
      <Link to="/" className="font-medium text-moss underline underline-offset-2">
        Back to the front desk
      </Link>
    </EmptyState>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Scripts />
      </body>
    </html>
  )
}
