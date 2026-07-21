'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { canAccess } from '@/lib/roles'
import { useAuthStore } from '@/lib/store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.user?.role)
  const onboarded = useAuthStore((s) => s.user?.onboarded)

  // Wait for the persisted auth store to rehydrate from localStorage before
  // deciding to redirect — otherwise a refresh bounces a logged-in user to
  // /login (accessToken is briefly null on first render).
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const p = useAuthStore.persist
    if (!p) {
      setHydrated(true)
      return
    }
    const unsub = p.onFinishHydration(() => setHydrated(true))
    if (p.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!accessToken) {
      router.replace('/login')
      return
    }
    // First-run: send unfinished users through the onboarding wizard.
    if (accessToken && onboarded === false) {
      router.replace('/onboarding')
      return
    }
    if (role && !canAccess(role, pathname)) {
      router.replace('/dashboard')
    }
  }, [hydrated, accessToken, role, onboarded, pathname, router])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
