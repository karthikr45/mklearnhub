'use client'

import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react'

import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/lib/store'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here's what's happening across your organization."
      />
      <StatsGrid
        stats={[
          { label: 'Total Members', value: 12, icon: Users, delta: '+2 this week' },
          { label: 'Courses', value: 3, icon: GraduationCap },
          { label: 'Articles', value: 10, icon: BookOpen },
          { label: 'Completion Rate', value: '68%', icon: TrendingUp, delta: '+5%' },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <ul className="space-y-3 text-sm">
            {[
              'New learner enrolled in Intro to TypeScript',
              'Article “Getting Started” published',
              'Quiz “Knowledge Check” attempted',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold">Continue learning</h3>
          <div className="space-y-4">
            {[
              { title: 'Intro to TypeScript', pct: 45 },
              { title: 'Advanced React', pct: 20 },
            ].map(({ title, pct }) => (
              <div key={title}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{title}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
