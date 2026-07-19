'use client'

import type { Course } from '@learnhub/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Enrollment {
  id: string
  progressPct: number
  status: string
  course: { id: string; title: string; description?: string | null }
}

export default function ExplorePage() {
  const qc = useQueryClient()

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await api.get<Course[]>('/courses')
      return data
    },
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const { data } = await api.get<Enrollment[]>('/courses/me/enrollments')
      return data
    },
  })

  const enroll = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post(`/courses/${courseId}/enroll`)
      return data
    },
    onSuccess: () => {
      toast.success('Enrolled')
      void qc.invalidateQueries({ queryKey: ['enrollments'] })
      void qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: () => toast.error('Could not enroll'),
  })

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course.id))
  const published = (courses ?? []).filter((c) => c.status === 'PUBLISHED')

  return (
    <div>
      <PageHeader
        title="Explore"
        description="Discover courses published in your organization."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : published.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Compass className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No published courses yet</p>
          <p className="text-sm text-muted-foreground">
            Check back later for new courses.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((course) => {
            const isEnrolled = enrolledIds.has(course.id)
            return (
              <div
                key={course.id}
                className="flex flex-col rounded-lg border bg-card p-5"
              >
                <div className="mb-3 flex h-28 items-center justify-center rounded-md bg-muted">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">{course.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {course.description ?? 'No description'}
                </p>
                <div className="mt-auto">
                  {isEnrolled ? (
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Enrolled ✓ — Continue
                    </Link>
                  ) : (
                    <button
                      onClick={() => enroll.mutate(course.id)}
                      disabled={enroll.isPending}
                      className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {enroll.isPending ? 'Enrolling…' : 'Enroll'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
