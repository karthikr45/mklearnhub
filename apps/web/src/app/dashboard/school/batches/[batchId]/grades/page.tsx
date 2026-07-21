'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Student {
  user: { id: string; name: string; email: string }
}

interface Batch {
  id: string
  name: string
  students?: Student[]
}

interface Grade {
  id: string
  subject: string
  score: number
  maxScore: number
  term?: string | null
  gradeLabel?: string | null
}

export default function GradesPage() {
  const params = useParams<{ batchId: string }>()
  const batchId = params.batchId
  const queryClient = useQueryClient()

  const [studentId, setStudentId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const [term, setTerm] = useState('')

  const { data: batch } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      const { data } = await api.get<Batch>(`/school/batches/${batchId}`)
      return data
    },
    enabled: Boolean(batchId),
  })

  const students = useMemo(() => batch?.students ?? [], [batch])

  useEffect(() => {
    if (!studentId && students.length > 0) {
      const first = students[0]
      if (first) setStudentId(first.user.id)
    }
  }, [students, studentId])

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades', studentId],
    queryFn: async () => {
      const { data } = await api.get<Grade[]>(
        `/school/students/${studentId}/grades`,
      )
      return Array.isArray(data) ? data : []
    },
    enabled: Boolean(studentId),
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const body: {
        subject: string
        score: number
        maxScore: number
        term?: string
      } = {
        subject: subject.trim(),
        score: Number(score),
        maxScore: Number(maxScore),
        ...(term.trim() ? { term: term.trim() } : {}),
      }
      await api.post(`/school/students/${studentId}/grades`, body)
    },
    onSuccess: () => {
      toast.success('Grade added')
      setSubject('')
      setScore('')
      setTerm('')
      setShowForm(false)
      void queryClient.invalidateQueries({ queryKey: ['grades', studentId] })
    },
    onError: () => toast.error('Could not add grade'),
  })

  const submit = () => {
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    if (!score.trim() || !Number.isFinite(Number(score))) {
      toast.error('Valid score is required')
      return
    }
    if (!Number.isFinite(Number(maxScore)) || Number(maxScore) <= 0) {
      toast.error('Valid max score is required')
      return
    }
    addMutation.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Grades"
        description={batch?.name ?? 'Student grades'}
        action={
          <Link
            href={`/dashboard/school/batches/${batchId}`}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to batch
          </Link>
        }
      />

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No students enrolled in this batch.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-end gap-4 card-elevated p-5">
            <div className="min-w-56">
              <label className="text-xs font-medium text-muted-foreground">
                Student
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {students.map((s) => (
                  <option key={s.user.id} value={s.user.id}>
                    {s.user.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add grade
            </button>
          </div>

          {showForm ? (
            <div className="mb-6 card-elevated p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    Score
                  </label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 85"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Max score
                  </label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Term (optional)
                  </label>
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g. Term 1"
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
                  Add grade
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

          <div className="card-elevated">
            {isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading…</p>
            ) : !grades || grades.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No grades recorded for this student yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-5 py-2 font-medium">Subject</th>
                    <th className="px-5 py-2 font-medium">Score</th>
                    <th className="px-5 py-2 font-medium">%</th>
                    <th className="px-5 py-2 font-medium">Term</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => {
                    const pct =
                      g.maxScore > 0
                        ? Math.round((g.score / g.maxScore) * 100)
                        : 0
                    return (
                      <tr key={g.id} className="border-t">
                        <td className="px-5 py-2 font-medium">{g.subject}</td>
                        <td className="px-5 py-2 text-muted-foreground">
                          {g.score} / {g.maxScore}
                        </td>
                        <td className="px-5 py-2">{pct}%</td>
                        <td className="px-5 py-2 text-muted-foreground">
                          {g.term ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
