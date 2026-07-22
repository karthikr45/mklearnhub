'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileText, Loader2, Play, Upload } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { VideoPlayer } from '@/components/courses/VideoPlayer'
import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

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
  const qc = useQueryClient()
  const role = useAuthStore((s) => s.user?.role)
  const canEdit =
    role === 'INSTRUCTOR' || role === 'ORG_ADMIN' || role === 'SUPER_ADMIN'
  const [videoUrl, setVideoUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const attachUrl = useMutation({
    mutationFn: async (url: string) => {
      await api.post(`/video/lessons/${lessonId}/url`, { videoUrl: url })
    },
    onSuccess: () => {
      setVideoUrl('')
      qc.invalidateQueries({ queryKey: ['course-detail', courseId] })
      toast.success('Video attached')
    },
    onError: () => toast.error('Could not attach video (instructor only)'),
  })

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      // 1) presigned direct-to-storage (R2/S3) URL
      const { data: presign } = await api.post<{ url: string; key: string }>(
        `/video/lessons/${lessonId}/upload-url`,
        {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        },
      )
      // 2) upload the file straight to storage (no auth header — URL is signed)
      const put = await fetch(presign.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!put.ok) {
        throw new Error(
          `Storage rejected the upload (HTTP ${put.status}). If this is CORS, add a PUT rule to the R2 bucket.`,
        )
      }
      // 3) point the lesson at the uploaded object
      await api.post(`/video/lessons/${lessonId}/attach-key`, { key: presign.key })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-detail', courseId] })
      qc.invalidateQueries({ queryKey: ['lesson-stream', lessonId] })
      toast.success('Video uploaded')
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Upload failed'),
  })

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const { data } = await api.get<CourseDetail>(`/courses/${courseId}`)
      return data
    },
    enabled: Boolean(courseId),
  })

  // Fresh delivery URL for the video (object-storage signed URLs expire, so we
  // fetch one at play time instead of relying on a stored URL).
  const { data: stream } = useQuery({
    queryKey: ['lesson-stream', lessonId],
    queryFn: async () =>
      (await api.get<{ videoUrl: string | null }>(`/video/${lessonId}/stream`)).data,
    enabled: Boolean(lessonId),
    retry: false,
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
          <div className="card-elevated p-4">
            {stream?.videoUrl ?? currentLesson.videoUrl ? (
              <VideoPlayer src={(stream?.videoUrl ?? currentLesson.videoUrl) as string} />
            ) : (
              renderContent(currentLesson.content)
            )}

            {canEdit ? (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {currentLesson.videoUrl ? 'Replace video' : 'Add a video'}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (videoUrl.trim()) attachUrl.mutate(videoUrl.trim())
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Paste an mp4, .m3u8 (HLS), or YouTube URL"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={attachUrl.isPending}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Attach
                  </button>
                </form>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadFile.mutate(f)
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadFile.isPending}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploadFile.isPending ? 'Uploading…' : 'Upload a file'}
                </button>
              </div>
            ) : null}
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

        <aside className="card-elevated">
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
