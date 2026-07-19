'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { apiGet } from '@/lib/api'

interface OrgUser {
  id: string
  name: string
  email: string
  role: string
}

interface OrganizationDetail {
  id: string
  name: string
  slug: string
  plan: string
  type: string
  isActive: boolean
  _count: {
    users: number
    courses: number
    spaces: number
  }
  users: OrgUser[]
}

export default function OrganizationDetailPage() {
  const params = useParams<{ orgId: string }>()
  const orgId = params.orgId
  const [org, setOrg] = useState<OrganizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiGet<OrganizationDetail>(
          `/admin/organizations/${orgId}`,
        )
        if (!cancelled) setOrg(res)
      } catch {
        if (!cancelled) setError('Failed to load organization')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [orgId])

  const counts = org
    ? [
        { label: 'Users', value: org._count.users },
        { label: 'Courses', value: org._count.courses },
        { label: 'Spaces', value: org._count.spaces },
      ]
    : []

  return (
    <div>
      <Link
        href="/organizations"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to organizations
      </Link>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">{error}</p>
      ) : org ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            <span
              className={
                org.isActive
                  ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                  : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
              }
            >
              {org.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {org.slug} · {org.plan} · {org.type}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {counts.map((c) => (
              <div key={c.label} className="rounded-lg border bg-card p-5">
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="mt-2 text-3xl font-bold tracking-tight">
                  {c.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">Recent users</h2>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {org.users.length > 0 ? (
                  org.users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No users.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
