'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, FileText, Loader2, Play } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface LearnLesson {
  id: string
  title: string
  type: string
  order: number
  videoUrl?: string | null
  videoDurationSecs?: number | null
  content?: unknown
}

interface LearnChapter {
  id: string
  title: string
  order: number
  lessons: LearnLesson[]
}

interface CourseDetail {
  id: string
  title: string
  chapters: LearnChapter[]
}

interface TipTapNode {
  type?: string
  text?: string
  content?: TipTapNode[]
}

function isTipTapDoc(value: unknown): value is TipTapNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'doc'
  )
}

function extractText(node: TipTapNode): string {
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.content)) {
    return node.content.map(extractText).join('')
  }
  return ''
}

function renderContent(content: unknown) {
  if (content === null || content === undefined || content === '') {
    return (
      <p className="text-sm text-muted-foreground">No content yet.</p>
    )
  }
  if (typeof content === 'string') {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
  }
  if (isTipTapDoc(content)) {
    const paragraphs = (content.content ?? []).map((n) => extractText(n))
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {p}
          </p>
        ))}
      </div>
    )
  }
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
      {JSON.stringify(content, null, 2)}
    </pre>
  )
}

export default function LessonPlayerPage() {
  const params = useParams<{ courseId: string; lessonId: string }>()
  const { courseId, lessonId } = params
  const router = useRouter()

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const { data } = await api.get<CourseDetail>(`/courses/${courseId}`)
      return data
    },
    enabled: Boolean(courseId),
  })

  const orderedLessons: LearnLesson[] = course
    ? course.chapters
        .slice()
        .sort((a, b) => a.order - b.order)
        .flatMap((c) =>
          c.lessons.slice().sort((a, b) => a.order - b.order),
        )
    : []

  const currentIndex = orderedLessons.findIndex((l) => l.id === lessonId)
  const currentLesson =
    currentIndex >= 0 ? orderedLessons[currentIndex] : undefined
  const nextLesson =
    currentIndex >= 0 ? orderedLessons[currentIndex + 1] : undefined

  const markComplete = useMutation({
    mutationFn: async () => {
      const watchedSecs = currentLesson?.videoDurationSecs || 60
      const { data } = await api.post(
        `/courses/lessons/${lessonId}/progress`,
        { watchedSecs },
      )
      return data
    },
    onSuccess: () => {
      toast.success('Lesson completed')
      if (nextLesson) {
        router.push(`/dashboard/courses/${courseId}/learn/${nextLesson.id}`)
      } else {
        router.push(`/dashboard/courses/${courseId}`)
      }
    },
    onError: () => toast.error('Failed to save progress'),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (!course || !currentLesson) {
    return <p className="text-sm text-muted-foreground">Lesson not found.</p>
  }

  return (
    <div>
      <PageHeader title={currentLesson.title} description={course.title} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="rounded-lg border bg-card p-4">
            {currentLesson.videoUrl ? (
              <video
                controls
                src={currentLesson.videoUrl}
                className="w-full rounded-lg"
              />
            ) : (
              renderContent(currentLesson.content)
            )}
          </div>

          <button
            onClick={() => markComplete.mutate()}
            disabled={markComplete.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {markComplete.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {nextLesson ? 'Mark complete & next' : 'Mark complete & finish'}
          </button>
        </div>

        <aside className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">
            Course content
          </div>
          <ul>
            {orderedLessons.map((lesson) => {
              const active = lesson.id === lessonId
              return (
                <li key={lesson.id} className="border-b last:border-b-0">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/courses/${courseId}/learn/${lesson.id}`,
                      )
                    }
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50 ${
                      active ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    <span className="text-muted-foreground">
                      {lesson.type === 'VIDEO' ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <span className="flex-1">{lesson.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </div>
  )
}
