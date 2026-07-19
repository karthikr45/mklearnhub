'use client'

import {
  Building2,
  Flag,
  LogOut,
  Megaphone,
  Receipt,
  ScrollText,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { apiGet, clearToken, getToken } from '@/lib/api'

const NAV = [
  { href: '/', label: 'Overview', icon: Building2 },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/feature-flags', label: 'Feature Flags', icon: Flag },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

interface MeResponse {
  id: string
  name: string
  email: string
  role: string
  orgId: string | null
}

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const isLogin = pathname === '/login'

  useEffect(() => {
    if (isLogin) {
      setChecking(false)
      return
    }

    let cancelled = false

    const verify = async () => {
      const token = getToken()
      if (!token) {
        router.replace('/login')
        return
      }
      try {
        const me = await apiGet<MeResponse>('/auth/me')
        if (cancelled) return
        if (me.role !== 'SUPER_ADMIN') {
          clearToken()
          router.replace('/login')
          return
        }
        setChecking(false)
      } catch {
        if (cancelled) return
        clearToken()
        router.replace('/login')
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [isLogin, router])

  const handleLogout = () => {
    clearToken()
    router.replace('/login')
  }

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-6 font-bold">
          LearnHub Admin
        </div>
        <nav className="flex-1 space-y-1 p-3">
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
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
