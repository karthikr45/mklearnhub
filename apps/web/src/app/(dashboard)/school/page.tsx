'use client'

import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, ClipboardList, GraduationCap, Users } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Batch {
  id: string
  name: string
  isActive: boolean
  _count?: { students?: number }
}

export default function SchoolPage() {
  const { data: batches } = useQuery({
    queryKey: ['school-batches'],
    queryFn: async () => {
      const { data } = await api.get<Batch[]>('/school/batches')
      return data
    },
  })

  const batchCount = batches?.length ?? 0
  const activeCount = batches?.filter((b) => b.isActive).length ?? 0
  const studentCount =
    batches?.reduce((sum, b) => sum + (b._count?.students ?? 0), 0) ?? 0

  return (
    <div>
      <PageHeader
        title="School"
        description="Batches, attendance, timetable, and grades."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Batches</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{batchCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Active batches</p>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Enrolled students</p>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{studentCount}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/school/batches"
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">Batches</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create batches, enroll students, and manage classes.
          </p>
        </Link>
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">Attendance, Timetable &amp; Grades</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a batch to record attendance, build its timetable, and enter
            grades.
          </p>
        </div>
      </div>
    </div>
  )
}
