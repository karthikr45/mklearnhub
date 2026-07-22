'use client'

import type { Course } from '@learnhub/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, GraduationCap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

type CatalogCourse = Course & { recommended?: boolean }

interface Enrollment {
  id: string
  progressPct: number
  status: string
  course: { id: string; title: string; description?: string | null }
}

export default function ExplorePage() {
  const qc = useQueryClient()

  const { data: courses, isLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const { data } = await api.get<CatalogCourse[]>('/courses/catalog')
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
    },
    onError: () => toast.error('Could not enroll'),
  })

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course.id))
  const all = courses ?? []
  const recommended = all.filter((c) => c.recommended)
  const rest = all.filter((c) => !c.recommended)

  const Card = ({ course }: { course: CatalogCourse }) => {
    const isEnrolled = enrolledIds.has(course.id)
    return (
      <div className="flex flex-col card-elevated card-elevated-hover p-5">
        <div className="mb-3 flex h-28 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-violet-500/5">
          <GraduationCap className="h-8 w-8 text-primary/70" />
        </div>
        <div className="mb-1 flex flex-wrap gap-1">
          {(course.tags ?? []).slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
              {t}
            </span>
          ))}
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
  }

  return (
    <div>
      <PageHeader
        title="Explore"
        description="Courses for boards, Intermediate, JEE/NEET/EAMCET and more — pick one and start."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : all.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Compass className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No courses yet</p>
          <p className="text-sm text-muted-foreground">Check back soon for new courses.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {recommended.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Recommended for you
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((c) => (
                  <Card key={c.id} course={c} />
                ))}
              </div>
            </section>
          )}
          <section>
            {recommended.length > 0 && (
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                All courses
              </h2>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((c) => (
                <Card key={c.id} course={c} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
