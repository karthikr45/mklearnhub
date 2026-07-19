'use client'

import { useQuery } from '@tanstack/react-query'
import { School } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface TimetableSlot {
  dayOfWeek: number | string
  startTime: string
  endTime: string
  subject: string
  room?: string | null
}

interface Batch {
  id: string
  name: string
  academicYear?: string | null
  timetable: TimetableSlot[]
}

interface Grade {
  subject: string
  score: number
  maxScore: number
  term: string
}

interface Attendance {
  present: number
  absent: number
  late: number
  excused: number
  total: number
  rate: number
}

interface Overview {
  batches: Batch[]
  grades: Grade[]
  attendance: Attendance
}

const DAYS: { label: string; short: string; num: number }[] = [
  { label: 'Monday', short: 'Mon', num: 1 },
  { label: 'Tuesday', short: 'Tue', num: 2 },
  { label: 'Wednesday', short: 'Wed', num: 3 },
  { label: 'Thursday', short: 'Thu', num: 4 },
  { label: 'Friday', short: 'Fri', num: 5 },
  { label: 'Saturday', short: 'Sat', num: 6 },
  { label: 'Sunday', short: 'Sun', num: 0 },
]

function matchesDay(
  slot: TimetableSlot,
  day: { label: string; num: number },
): boolean {
  if (typeof slot.dayOfWeek === 'number') return slot.dayOfWeek === day.num
  const value = slot.dayOfWeek.toLowerCase()
  return (
    value === day.label.toLowerCase() ||
    value === day.label.slice(0, 3).toLowerCase()
  )
}

export default function MyClassPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['school-overview'],
    queryFn: async () => {
      const { data } = await api.get<Overview>('/school/me/overview')
      return data
    },
  })

  const batches = data?.batches ?? []
  const timetable = batches.flatMap((b) => b.timetable ?? [])
  const grades = data?.grades ?? []
  const attendance = data?.attendance

  return (
    <div>
      <PageHeader
        title="My Class"
        description="Your batch, timetable, grades, and attendance."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : batches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <School className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">You are not in a batch yet</p>
          <p className="text-sm text-muted-foreground">
            Ask the school to add you to a class.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Batch
            </h2>
            <div className="flex flex-wrap gap-3">
              {batches.map((batch) => (
                <div key={batch.id} className="rounded-lg border bg-card p-4">
                  <p className="font-medium">{batch.name}</p>
                  {batch.academicYear && (
                    <p className="text-xs text-muted-foreground">
                      {batch.academicYear}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Weekly timetable
            </h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Day</th>
                    <th className="px-4 py-3 font-medium">Classes</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const slots = timetable
                      .filter((s) => matchesDay(s, day))
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    return (
                      <tr key={day.num} className="border-t align-top">
                        <td className="px-4 py-3 font-medium">{day.short}</td>
                        <td className="px-4 py-3">
                          {slots.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {slots.map((slot, i) => (
                                <span
                                  key={`${day.num}-${i}`}
                                  className="rounded-md bg-secondary px-2 py-1 text-xs"
                                >
                                  {slot.startTime}–{slot.endTime} {slot.subject}
                                  {slot.room ? ` · ${slot.room}` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Grades
            </h2>
            {grades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Term</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade, i) => {
                      const pct =
                        grade.maxScore > 0
                          ? Math.round((grade.score / grade.maxScore) * 100)
                          : 0
                      return (
                        <tr key={`${grade.subject}-${i}`} className="border-t">
                          <td className="px-4 py-3 font-medium">
                            {grade.subject}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {grade.term}
                          </td>
                          <td className="px-4 py-3">
                            {grade.score}/{grade.maxScore}
                          </td>
                          <td className="px-4 py-3">{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {attendance && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Attendance
              </h2>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-2xl font-bold">
                    {Math.round(attendance.rate)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Attendance rate</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-2xl font-bold">
                    {attendance.present}/{attendance.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Present · {attendance.absent} absent · {attendance.late} late
                    · {attendance.excused} excused
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
