'use client'

import { GraduationCap, Plus } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { useCourses } from '@/hooks/useCourse'

export default function CoursesPage() {
  const { data: courses, isLoading } = useCourses()

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Browse and manage your organization's courses."
        action={
          <Link
            href="/dashboard/courses/create"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New course
          </Link>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !courses || courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No courses yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first course to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-28 items-center justify-center rounded-md bg-muted">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">{course.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {course.description ?? 'No description'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
