import Link from 'next/link'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/docs" className="text-2xl font-bold">
              📚 itellico Mono Docs
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/docs" className="hover:underline">
                Home
              </Link>
              <Link href="/docs/claude" className="hover:underline">
                CLAUDE.md
              </Link>
              <Link href="/docs/README" className="hover:underline">
                Getting Started
              </Link>
              <Link href="/" className="hover:underline">
                Back to App
              </Link>
            </div>
          </nav>
        </div>
      </div>
      <main>{children}</main>
    </div>
  )
}