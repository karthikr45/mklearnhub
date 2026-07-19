'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface CreatedCourse {
  id: string
  title: string
}

interface CreateCoursePayload {
  title: string
  description?: string
  isFree: boolean
  price?: number
  tags?: string[]
}

export default function CreateCoursePage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState('')

  const createCourse = useMutation({
    mutationFn: async (payload: CreateCoursePayload) => {
      const { data } = await api.post<CreatedCourse>('/courses', payload)
      return data
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course created')
      router.push(`/dashboard/courses/${course.id}`)
    },
    onError: () => toast.error('Failed to create course'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      toast.error('Title is required')
      return
    }

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: CreateCoursePayload = {
      title: trimmed,
      isFree,
    }
    const trimmedDesc = description.trim()
    if (trimmedDesc) payload.description = trimmedDesc
    if (parsedTags.length > 0) payload.tags = parsedTags
    if (!isFree) {
      const numericPrice = Number(price)
      payload.price = Number.isFinite(numericPrice) ? numericPrice : 0
    }

    createCourse.mutate(payload)
  }

  return (
    <div>
      <PageHeader
        title="Create Course"
        description="Set up a new course for your organization."
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6 rounded-lg border bg-card p-6"
      >
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to TypeScript"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What will learners get out of this course?"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium">Pricing</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsFree(true)}
              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                isFree
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setIsFree(false)}
              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                !isFree
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Paid
            </button>
          </div>
          {!isFree && (
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="49.00"
                className="flex h-10 w-full max-w-[12rem] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags
          </label>
          <input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="typescript, web, beginner"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createCourse.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createCourse.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create course
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/courses')}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
