'use client'

import { useQuery } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Member {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function MembersPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)

  const { data, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Member[]; total: number }>(
        `/organizations/${orgId}/members`,
      )
      return data
    },
    enabled: Boolean(orgId),
  })

  return (
    <div>
      <PageHeader
        title="Members"
        description="People in your organization."
        action={
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <UserPlus className="h-4 w-4" /> Invite
          </button>
        }
      />

      {!orgId ? (
        <p className="text-sm text-muted-foreground">
          You are not part of an organization yet.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {m.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
