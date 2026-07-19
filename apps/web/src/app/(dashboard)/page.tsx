'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, GraduationCap, TrendingUp, Users } from 'lucide-react'

import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface OrgStats {
  totalUsers?: number
  totalCourses?: number
  totalEnrollments?: number
  completionRate?: number
}

interface ActivityItem {
  id: string
  label: string
  at?: string
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return ''
}

function extractActivity(payload: unknown): ActivityItem[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  const candidates = [
    root['recentActivity'],
    root['recentActivities'],
    root['activity'],
    root['recent'],
    root['events'],
  ]
  const arr = candidates.find((c) => Array.isArray(c)) as unknown[] | undefined
  if (!arr) return []
  return arr.slice(0, 8).map((raw, index) => {
    const item =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    const label = pickString(item, [
      'label',
      'message',
      'title',
      'description',
      'action',
      'name',
    ])
    const id =
      typeof item['id'] === 'string' ? (item['id'] as string) : `activity-${index}`
    const at = pickString(item, ['createdAt', 'at', 'timestamp', 'date'])
    return {
      id,
      label: label || 'Activity',
      ...(at ? { at } : {}),
    }
  })
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? null

  const { data: stats, isLoading } = useQuery({
    queryKey: ['org-stats', orgId],
    queryFn: async () => {
      const { data } = await api.get<OrgStats>(`/organizations/${orgId}/stats`)
      return data
    },
    enabled: Boolean(orgId),
  })

  const { data: activity } = useQuery({
    queryKey: ['dashboard-activity', orgId],
    queryFn: async () => {
      const { data } = await api.get<unknown>('/analytics/dashboard')
      return extractActivity(data)
    },
    enabled: Boolean(orgId),
  })

  const completion = stats?.completionRate ?? 0
  const completionLabel = `${Math.round(completion > 1 ? completion : completion * 100)}%`

  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here's what's happening across your organization."
      />

      {!orgId ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No organization</p>
          <p className="text-sm text-muted-foreground">
            Your account is not associated with an organization yet.
          </p>
        </div>
      ) : (
        <>
          <StatsGrid
            stats={[
              {
                label: 'Total Members',
                value: isLoading ? '—' : (stats?.totalUsers ?? 0),
                icon: Users,
              },
              {
                label: 'Courses',
                value: isLoading ? '—' : (stats?.totalCourses ?? 0),
                icon: GraduationCap,
              },
              {
                label: 'Enrollments',
                value: isLoading ? '—' : (stats?.totalEnrollments ?? 0),
                icon: Activity,
              },
              {
                label: 'Completion Rate',
                value: isLoading ? '—' : completionLabel,
                icon: TrendingUp,
              },
            ]}
          />

          <div className="mt-8 rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Recent activity</h3>
            {activity && activity.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.at ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(item.at).toLocaleDateString()}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No recent activity to show yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
