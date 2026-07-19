'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
const STATUSES: Status[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

interface Student {
  user: { id: string; name: string; email: string }
}

interface Batch {
  id: string
  name: string
  students?: Student[]
}

interface AttendanceRecord {
  id?: string
  date?: string
  userId?: string
  status?: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendancePage() {
  const params = useParams<{ batchId: string }>()
  const batchId = params.batchId
  const queryClient = useQueryClient()

  const [date, setDate] = useState(todayISO())
  const [statuses, setStatuses] = useState<Record<string, Status>>({})

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      const { data } = await api.get<Batch>(`/school/batches/${batchId}`)
      return data
    },
    enabled: Boolean(batchId),
  })

  const students = useMemo(() => batch?.students ?? [], [batch])

  useEffect(() => {
    setStatuses((prev) => {
      const next: Record<string, Status> = {}
      for (const s of students) {
        next[s.user.id] = prev[s.user.id] ?? 'PRESENT'
      }
      return next
    })
  }, [students])

  const rangeStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return d.toISOString().slice(0, 10)
  }, [])

  const { data: recent } = useQuery({
    queryKey: ['attendance', batchId, rangeStart, date],
    queryFn: async () => {
      const { data } = await api.get<AttendanceRecord[]>(
        `/school/batches/${batchId}/attendance`,
        { params: { startDate: rangeStart, endDate: date } },
      )
      return Array.isArray(data) ? data : []
    },
    enabled: Boolean(batchId),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = students.map((s) => ({
        userId: s.user.id,
        status: statuses[s.user.id] ?? 'PRESENT',
      }))
      await api.post(`/school/batches/${batchId}/attendance`, { date, records })
    },
    onSuccess: () => {
      toast.success('Attendance saved')
      void queryClient.invalidateQueries({ queryKey: ['attendance', batchId] })
    },
    onError: () => toast.error('Could not save attendance'),
  })

  const recentByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of recent ?? []) {
      if (!r.date) continue
      const day = r.date.slice(0, 10)
      map.set(day, (map.get(day) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 7)
  }, [recent])

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={batch?.name ?? 'Record attendance'}
        action={
          <Link
            href={`/dashboard/school/batches/${batchId}`}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to batch
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border bg-card p-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={students.length === 0 || saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save attendance
        </button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : students.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No students enrolled in this batch.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-5 py-2 font-medium">Student</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.user.id} className="border-t">
                  <td className="px-5 py-3">
                    <div className="font-medium">{s.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.user.email}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((st) => {
                        const active =
                          (statuses[s.user.id] ?? 'PRESENT') === st
                        return (
                          <button
                            key={st}
                            onClick={() =>
                              setStatuses((prev) => ({
                                ...prev,
                                [s.user.id]: st,
                              }))
                            }
                            className={
                              active
                                ? 'rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground'
                                : 'rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted'
                            }
                          >
                            {st}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {recentByDate.length > 0 ? (
        <div className="mt-6 rounded-lg border bg-card p-5">
          <h3 className="mb-3 font-semibold">Recent attendance</h3>
          <ul className="space-y-2 text-sm">
            {recentByDate.map(([day, count]) => (
              <li
                key={day}
                className="flex items-center justify-between text-muted-foreground"
              >
                <span>{new Date(day).toLocaleDateString()}</span>
                <span>{count} records</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
