'use client'

import { useQuery } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Enrollment {
  id: string
  progressPct: number
  status: string
  course: {
    id: string
    title: string
    description?: string | null
  }
}

export default function LearningPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const { data } = await api.get<Enrollment[]>('/courses/me/enrollments')
      return data
    },
  })

  return (
    <div>
      <PageHeader
        title="My Learning"
        description="Pick up where you left off."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">You are not enrolled in any courses</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Browse the catalog to start learning.
          </p>
          <Link
            href="/dashboard/explore"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Explore courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((enrollment) => {
            const pct = Math.round(enrollment.progressPct)
            return (
              <div
                key={enrollment.id}
                className="flex flex-col rounded-lg border bg-card p-5"
              >
                <div className="mb-3 flex h-28 items-center justify-center rounded-md bg-muted">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">{enrollment.course.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {enrollment.course.description ?? 'No description'}
                </p>
                <div className="mt-auto space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {pct}% complete
                    </span>
                    <Link
                      href={`/dashboard/courses/${enrollment.course.id}`}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
