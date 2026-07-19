'use client'

import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Play } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface QuizListItem {
  id: string
  title: string
  passingScore: number
  isPublished: boolean
  _count?: { questions: number }
}

export default function AssessmentsPage() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data } = await api.get<QuizListItem[]>('/assessments/quizzes')
      return data
    },
  })

  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Quizzes and assignments for your organization."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !quizzes || quizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No quizzes yet</p>
          <p className="text-sm text-muted-foreground">
            Quizzes will appear here once created.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Questions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{quiz.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {quiz._count?.questions ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        quiz.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/assessments/${quiz.id}`}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Play className="h-4 w-4" /> Attempt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
