'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login')
      return
    }
    // Keep roles inside the sections they're allowed to see.
    if (role && !canAccess(role, pathname)) {
      router.replace('/dashboard')
    }
  }, [accessToken, role, pathname, router])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
