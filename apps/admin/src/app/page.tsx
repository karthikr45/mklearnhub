'use client'

import { useEffect, useState } from 'react'

import { apiGet } from '@/lib/api'

interface PlanBreakdown {
  plan: string
  count: number
}

interface AdminStats {
  totalOrganizations: number
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  activeOrganizations: number
  byPlan: PlanBreakdown[]
}

const KPI_LABELS: { key: keyof AdminStats; label: string }[] = [
  { key: 'totalOrganizations', label: 'Organizations' },
  { key: 'totalUsers', label: 'Users' },
  { key: 'totalCourses', label: 'Courses' },
  { key: 'totalEnrollments', label: 'Enrollments' },
  { key: 'activeOrganizations', label: 'Active Orgs' },
]

export default function Page() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await apiGet<AdminStats>('/admin/stats')
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setError('Failed to load stats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const maxPlan = stats
    ? Math.max(1, ...stats.byPlan.map((p) => p.count))
    : 1

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Key metrics across all organizations.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">{error}</p>
      ) : stats ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {KPI_LABELS.map(({ key, label }) => (
              <div key={key} className="rounded-lg border bg-card p-5">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-2 text-3xl font-bold tracking-tight">
                  {stats[key].toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Organizations by plan</h2>
            {stats.byPlan.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No data.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {stats.byPlan.map((p) => (
                  <div key={p.plan} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-sm font-medium">
                      {p.plan}
                    </div>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full rounded bg-primary"
                        style={{ width: `${(p.count / maxPlan) * 100}%` }}
                      />
                    </div>
                    <div className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                      {p.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
