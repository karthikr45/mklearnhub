'use client'

import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Child {
  id: string
  name: string
  email: string
}

export default function ChildrenPage() {
  const userId = useAuthStore((s) => s.user?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['children', userId],
    queryFn: async () => {
      const { data } = await api.get<Child[]>(
        `/school/parents/${userId}/children`,
      )
      return data
    },
    enabled: Boolean(userId),
  })

  return (
    <div>
      <PageHeader
        title="My Children"
        description="Track your children's progress."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No children linked</p>
          <p className="text-sm text-muted-foreground">
            Ask the school to link them to your account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((child) => (
            <Link
              key={child.id}
              href={`/dashboard/children/${child.id}`}
              className="card-elevated card-elevated-hover p-5"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">{child.name}</h3>
              <p className="text-sm text-muted-foreground">{child.email}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
