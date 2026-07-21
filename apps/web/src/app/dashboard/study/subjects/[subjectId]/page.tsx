'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, FileQuestion } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { StartButton } from '@/components/study/StartButton'
import { api } from '@/lib/api'

interface Chapter {
  id: string
  name: string
  topicCount: number
  questionCount: number
}
interface SubjectDetail {
  id: string
  name: string
  grade: string | null
  chapters: Chapter[]
}

export default function SubjectPage() {
  const params = useParams<{ subjectId: string }>()
  const subjectId = params.subjectId

  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: async () =>
      (await api.get<SubjectDetail>(`/study/subjects/${subjectId}`)).data,
    enabled: Boolean(subjectId),
  })

  return (
    <div>
      <Link
        href="/dashboard/study"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title={subject?.name ?? 'Subject'}
          description={subject?.grade ?? 'Practice by chapter'}
        />
        {subject && (
          <StartButton subjectId={subject.id} limit={10} label="Practice all chapters" />
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !subject || subject.chapters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chapters yet.</p>
      ) : (
        <div className="space-y-3">
          {subject.chapters.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between card-elevated p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-medium">{c.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileQuestion className="h-3 w-3" /> {c.topicCount} topics ·{' '}
                    {c.questionCount} questions
                  </p>
                </div>
              </div>
              {c.questionCount > 0 ? (
                <StartButton chapterId={c.id} limit={10} label="Practice" />
              ) : (
                <span className="text-xs text-muted-foreground">Coming soon</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
