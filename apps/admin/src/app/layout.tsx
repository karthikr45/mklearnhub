import type { Metadata } from 'next'
import {
  Building2,
  Flag,
  Megaphone,
  Receipt,
  ScrollText,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import './globals.css'

export const metadata: Metadata = {
  title: 'LearnHub Admin',
  description: 'Platform super-admin dashboard',
}

const NAV = [
  { href: '/', label: 'Overview', icon: Building2 },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/feature-flags', label: 'Feature Flags', icon: Flag },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          <aside className="w-60 shrink-0 border-r bg-card">
            <div className="flex h-14 items-center border-b px-6 font-bold">
              LearnHub Admin
            </div>
            <nav className="space-y-1 p-3">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
