'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { apiGet } from '@/lib/api'

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  type: string
  isActive: boolean
  _count: {
    users: number
    courses: number
  }
}

interface OrganizationsResponse {
  items: Organization[]
  total: number
  page: number
  pageSize: number
}

const PAGE_SIZE = 20

export default function OrganizationsPage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<OrganizationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        })
        if (search) params.set('q', search)
        const res = await apiGet<OrganizationsResponse>(
          `/admin/organizations?${params.toString()}`,
        )
        if (!cancelled) setData(res)
      } catch {
        if (!cancelled) setError('Failed to load organizations')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [page, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(q)
  }

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All organizations on the platform.
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="Search organizations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">{error}</p>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Users</th>
                  <th className="px-4 py-3 font-medium">Courses</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.items.length > 0 ? (
                  data.items.map((org) => (
                    <tr key={org.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/organizations/${org.id}`}
                          className="hover:underline"
                        >
                          {org.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {org.slug}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {org.type}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {org._count.users}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {org._count.courses}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            org.isActive
                              ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                              : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                          }
                        >
                          {org.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total.toLocaleString()} total · page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border px-3 py-1.5 font-medium hover:bg-accent disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border px-3 py-1.5 font-medium hover:bg-accent disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
