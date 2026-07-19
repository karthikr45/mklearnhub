'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Grade {
  subject: string
  score: number
  maxScore: number
  term: string
  gradeLabel?: string | null
}

export default function ChildDetailPage() {
  const params = useParams<{ childId: string }>()
  const childId = params.childId

  const { data, isLoading } = useQuery({
    queryKey: ['child-grades', childId],
    queryFn: async () => {
      const { data } = await api.get<Grade[]>(
        `/school/students/${childId}/grades`,
      )
      return data
    },
    enabled: Boolean(childId),
  })

  return (
    <div>
      <Link
        href="/dashboard/children"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to children
      </Link>

      <PageHeader
        title="Grades"
        description="Attendance can be added here later."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No grades yet</p>
          <p className="text-sm text-muted-foreground">
            Grades will appear here once recorded.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">%</th>
                <th className="px-4 py-3 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.map((grade, i) => {
                const pct =
                  grade.maxScore > 0
                    ? Math.round((grade.score / grade.maxScore) * 100)
                    : 0
                return (
                  <tr key={`${grade.subject}-${i}`} className="border-t">
                    <td className="px-4 py-3 font-medium">{grade.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {grade.term}
                    </td>
                    <td className="px-4 py-3">
                      {grade.score}/{grade.maxScore}
                    </td>
                    <td className="px-4 py-3">{pct}%</td>
                    <td className="px-4 py-3">{grade.gradeLabel ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
