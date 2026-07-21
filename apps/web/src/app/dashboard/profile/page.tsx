'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2, Download, Mail, ShieldCheck, Trash2, User } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { PushToggle } from '@/components/notifications/PushToggle'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Me {
  id: string
  name: string
  email: string
  role: string
  orgId: string | null
}

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user)

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const { data } = await api.get<Me>('/auth/me')
      return data
    },
  })

  const name = me?.name ?? storeUser?.name ?? ''
  const email = me?.email ?? storeUser?.email ?? ''
  const role = me?.role ?? storeUser?.role ?? ''
  const orgId = me?.orgId ?? storeUser?.orgId ?? null

  const fields: { label: string; value: string; icon: typeof User }[] = [
    { label: 'Name', value: name || '—', icon: User },
    { label: 'Email', value: email || '—', icon: Mail },
    { label: 'Role', value: role || '—', icon: ShieldCheck },
    { label: 'Organization', value: orgId ?? 'No organization', icon: Building2 },
  ]

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />

      <section className="mb-8 card-elevated p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {(name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{name || 'Unnamed user'}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </label>
              <input
                value={value}
                disabled
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Profile fields are read-only. Contact an administrator to update your
          details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Notifications
        </h2>
        <PushToggle />
      </section>

      <section className="card-elevated p-6">
        <h2 className="mb-1 text-lg font-semibold">Privacy &amp; Data</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Download a copy of your data or request account deletion.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/settings/privacy"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Download my data
          </Link>
          <Link
            href="/dashboard/settings/privacy"
            className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </Link>
        </div>
      </section>
    </div>
  )
}
