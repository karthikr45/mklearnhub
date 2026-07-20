'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { api } from '@/lib/api'

interface Props {
  label: string
  assessmentId?: string
  subjectId?: string
  chapterId?: string
  topicId?: string
  limit?: number
  className?: string
}

/**
 * Starts a practice set or fixed assessment, then routes to the attempt
 * runner. Centralises the "start → get attemptId → go" flow.
 */
export function StartButton({
  label,
  assessmentId,
  subjectId,
  chapterId,
  topicId,
  limit,
  className,
}: Props) {
  const router = useRouter()
  const start = useMutation({
    mutationFn: async () => {
      if (assessmentId) {
        return (await api.post(`/study/assessments/${assessmentId}/start`)).data
      }
      const body: Record<string, unknown> = { limit: limit ?? 10 }
      if (subjectId) body.subjectId = subjectId
      if (chapterId) body.chapterId = chapterId
      if (topicId) body.topicId = topicId
      return (await api.post('/study/practice/start', body)).data
    },
    onSuccess: (data: { attemptId: string }) => {
      router.push(`/dashboard/study/attempt/${data.attemptId}`)
    },
    onError: () => toast.error('No questions available for this selection yet'),
  })

  return (
    <button
      onClick={() => start.mutate()}
      disabled={start.isPending}
      className={
        className ??
        'inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50'
      }
    >
      {start.isPending ? 'Starting…' : label}
    </button>
  )
}
