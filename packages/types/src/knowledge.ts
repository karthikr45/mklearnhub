import { z } from 'zod'

export interface Space {
  id: string
  name: string
  slug: string
  description?: string | null
  organizationId: string
  portalId?: string | null
  iconEmoji?: string | null
  isPublic: boolean
  order: number
}

export interface Manual {
  id: string
  name: string
  slug: string
  description?: string | null
  spaceId: string
  order: number
  isPublic: boolean
}

export interface Article {
  id: string
  title: string
  slug: string
  content: unknown
  excerpt?: string | null
  manualId: string
  authorId: string
  status: string
  isPublic: boolean
  tags: string[]
  views: number
  version: number
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
}

export interface ArticleVersion {
  id: string
  articleId: string
  content: unknown
  version: number
  editedById: string
  createdAt: Date
}

export interface ArticleWithMeta extends Article {
  author: { id: string; name: string; avatarUrl?: string | null }
  space: { id: string; name: string; slug: string }
  manual: { id: string; name: string; slug: string }
}

export const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.unknown(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
})
export type CreateArticleDto = z.infer<typeof createArticleSchema>

export const updateArticleSchema = createArticleSchema.partial()
export type UpdateArticleDto = z.infer<typeof updateArticleSchema>

export const createSpaceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  iconEmoji: z.string().optional(),
})
export type CreateSpaceDto = z.infer<typeof createSpaceSchema>

export const createManualSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})
export type CreateManualDto = z.infer<typeof createManualSchema>
