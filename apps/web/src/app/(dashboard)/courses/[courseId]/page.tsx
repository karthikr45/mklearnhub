'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  ChevronDown,
  FileText,
  Loader2,
  Play,
  Plus,
  Rocket,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface DetailLesson {
  id: string
  title: string
  type: string
  order: number
  isPublished: boolean
  isFreePreview: boolean
  videoUrl?: string | null
  content?: unknown
}

interface DetailChapter {
  id: string
  title: string
  order: number
  lessons: DetailLesson[]
}

interface CourseDetail {
  id: string
  title: string
  description?: string | null
  status: string
  chapters: DetailChapter[]
}

interface EnrollmentItem {
  id: string
  course: { id: string }
}

function lessonIcon(type: string) {
  if (type === 'VIDEO') return <Play className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params.courseId
  const qc = useQueryClient()

  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({})
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [chapterTitle, setChapterTitle] = useState('')
  const [lessonForChapter, setLessonForChapter] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonType, setLessonType] = useState('VIDEO')

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const { data } = await api.get<CourseDetail>(`/courses/${courseId}`)
      return data
    },
    enabled: Boolean(courseId),
  })

  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const { data } = await api.get<EnrollmentItem[]>(
        '/courses/me/enrollments',
      )
      return data
    },
  })

  const isEnrolled = Boolean(enrollments?.some((e) => e.course?.id === courseId))

  const firstLesson = course?.chapters.flatMap((c) => c.lessons).find(Boolean)

  const refetchCourse = () =>
    qc.invalidateQueries({ queryKey: ['course-detail', courseId] })

  const addChapter = useMutation({
    mutationFn: async (payload: { title: string; order: number }) => {
      const { data } = await api.post(`/courses/${courseId}/chapters`, payload)
      return data
    },
    onSuccess: () => {
      setChapterTitle('')
      setShowChapterForm(false)
      toast.success('Chapter added')
      refetchCourse()
    },
    onError: () => toast.error('Failed to add chapter'),
  })

  const addLesson = useMutation({
    mutationFn: async (payload: {
      chapterId: string
      title: string
      type: string
      order: number
    }) => {
      const { chapterId, ...body } = payload
      const { data } = await api.post(
        `/courses/chapters/${chapterId}/lessons`,
        body,
      )
      return data
    },
    onSuccess: () => {
      setLessonTitle('')
      setLessonForChapter(null)
      toast.success('Lesson added')
      refetchCourse()
    },
    onError: () => toast.error('Failed to add lesson'),
  })

  const publish = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/courses/${courseId}/publish`)
      return data
    },
    onSuccess: () => {
      toast.success('Course published')
      refetchCourse()
    },
    onError: () => toast.error('Failed to publish'),
  })

  const enroll = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/courses/${courseId}/enroll`)
      return data
    },
    onSuccess: () => {
      toast.success('Enrolled! Start learning.')
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
    },
    onError: () => toast.error('Failed to enroll'),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (!course) {
    return <p className="text-sm text-muted-foreground">Course not found.</p>
  }

  const lessonCount = course.chapters.reduce(
    (sum, c) => sum + c.lessons.length,
    0,
  )
  const isDraft = course.status === 'DRAFT'

  return (
    <div>
      <PageHeader
        title={course.title}
        description={course.description ?? ''}
        action={
          <div className="flex items-center gap-2">
            {isDraft && (
              <button
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {publish.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Publish
              </button>
            )}
            {isEnrolled && firstLesson ? (
              <Link
                href={`/dashboard/courses/${courseId}/learn/${firstLesson.id}`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Play className="h-4 w-4" /> Continue
              </Link>
            ) : !isEnrolled ? (
              <button
                onClick={() => enroll.mutate()}
                disabled={enroll.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {enroll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enroll
              </button>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isDraft
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {course.status}
        </span>
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-4 w-4" /> {lessonCount} lesson
          {lessonCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Curriculum</h2>
        <button
          onClick={() => setShowChapterForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Add chapter
        </button>
      </div>

      {showChapterForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!chapterTitle.trim()) return
            addChapter.mutate({
              title: chapterTitle.trim(),
              order: course.chapters.length,
            })
          }}
          className="mb-4 flex gap-2 rounded-lg border bg-card p-4"
        >
          <input
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            placeholder="Chapter title"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={addChapter.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}

      {course.chapters.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No content yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first chapter to build the curriculum.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {course.chapters
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((chapter) => {
              const open = openChapters[chapter.id] ?? true
              return (
                <div
                  key={chapter.id}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <button
                    onClick={() =>
                      setOpenChapters((prev) => ({
                        ...prev,
                        [chapter.id]: !open,
                      }))
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-muted/50"
                  >
                    <span>{chapter.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="border-t">
                      {chapter.lessons.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-muted-foreground">
                          No lessons yet.
                        </p>
                      ) : (
                        <ul>
                          {chapter.lessons
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((lesson) => (
                              <li
                                key={lesson.id}
                                className="border-b last:border-b-0"
                              >
                                <Link
                                  href={`/dashboard/courses/${courseId}/learn/${lesson.id}`}
                                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                                >
                                  <span className="text-muted-foreground">
                                    {lessonIcon(lesson.type)}
                                  </span>
                                  <span className="flex-1">{lesson.title}</span>
                                  {lesson.isFreePreview && (
                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                                      Free preview
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      )}

                      {lessonForChapter === chapter.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (!lessonTitle.trim()) return
                            addLesson.mutate({
                              chapterId: chapter.id,
                              title: lessonTitle.trim(),
                              type: lessonType,
                              order: chapter.lessons.length,
                            })
                          }}
                          className="flex flex-wrap gap-2 border-t bg-muted/30 px-4 py-3"
                        >
                          <input
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            placeholder="Lesson title"
                            className="flex h-9 min-w-[12rem] flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <select
                            value={lessonType}
                            onChange={(e) => setLessonType(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="VIDEO">Video</option>
                            <option value="TEXT">Text</option>
                            <option value="EMBED">Embed</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="ASSIGNMENT">Assignment</option>
                          </select>
                          <button
                            type="submit"
                            disabled={addLesson.isPending}
                            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setLessonForChapter(null)}
                            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setLessonForChapter(chapter.id)
                            setLessonTitle('')
                            setLessonType('VIDEO')
                          }}
                          className="flex w-full items-center gap-2 border-t px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
                        >
                          <Plus className="h-4 w-4" /> Add lesson
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
