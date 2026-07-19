'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Slot {
  id?: string
  dayOfWeek: number | string
  startTime: string
  endTime: string
  subject: string
  room?: string | null
}

const DAYS = [
  { index: 0, label: 'Mon' },
  { index: 1, label: 'Tue' },
  { index: 2, label: 'Wed' },
  { index: 3, label: 'Thu' },
  { index: 4, label: 'Fri' },
  { index: 5, label: 'Sat' },
  { index: 6, label: 'Sun' },
]

const NAME_TO_INDEX: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
}

function dayIndex(day: number | string): number {
  if (typeof day === 'number') return ((day % 7) + 7) % 7
  const key = day.toLowerCase()
  return NAME_TO_INDEX[key] ?? 0
}

export default function TimetablePage() {
  const params = useParams<{ batchId: string }>()
  const batchId = params.batchId
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [day, setDay] = useState('0')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [subject, setSubject] = useState('')
  const [room, setRoom] = useState('')

  const { data: slots, isLoading } = useQuery({
    queryKey: ['timetable', batchId],
    queryFn: async () => {
      const { data } = await api.get<Slot[]>(
        `/school/batches/${batchId}/timetable`,
      )
      return Array.isArray(data) ? data : []
    },
    enabled: Boolean(batchId),
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const slot: {
        dayOfWeek: number
        startTime: string
        endTime: string
        subject: string
        room?: string
      } = {
        dayOfWeek: Number(day),
        startTime,
        endTime,
        subject: subject.trim(),
        ...(room.trim() ? { room: room.trim() } : {}),
      }
      await api.post(`/school/batches/${batchId}/timetable`, { slots: [slot] })
    },
    onSuccess: () => {
      toast.success('Slot added')
      setSubject('')
      setRoom('')
      setShowForm(false)
      void queryClient.invalidateQueries({ queryKey: ['timetable', batchId] })
    },
    onError: () => toast.error('Could not add slot'),
  })

  const byDay = (index: number): Slot[] =>
    (slots ?? [])
      .filter((s) => dayIndex(s.dayOfWeek) === index)
      .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))

  const submit = () => {
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    addMutation.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Weekly schedule for this batch."
        action={
          <div className="flex gap-2">
            <Link
              href={`/dashboard/school/batches/${batchId}`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to batch
            </Link>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add slot
            </button>
          </div>
        }
      />

      {showForm ? (
        <div className="mb-6 rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Day
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d.index} value={String(d.index)}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Room (optional)
              </label>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. 204"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={submit}
              disabled={addMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Add slot
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-7 gap-3">
            {DAYS.map((d) => {
              const daySlots = byDay(d.index)
              return (
                <div key={d.index} className="rounded-lg border bg-card">
                  <div className="border-b bg-muted/50 px-3 py-2 text-sm font-semibold">
                    {d.label}
                  </div>
                  <div className="space-y-2 p-2">
                    {daySlots.length === 0 ? (
                      <p className="px-1 py-2 text-xs text-muted-foreground">
                        No classes
                      </p>
                    ) : (
                      daySlots.map((s, i) => (
                        <div
                          key={s.id ?? `${d.index}-${i}`}
                          className="rounded-md border bg-background p-2"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            {s.startTime}–{s.endTime}
                          </p>
                          <p className="text-sm font-medium">{s.subject}</p>
                          {s.room ? (
                            <p className="text-xs text-muted-foreground">
                              Room {s.room}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
