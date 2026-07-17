'use client'

import type { Article } from '@learnhub/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

export function useArticle(articleId: string) {
  return useQuery({
    queryKey: ['articles', articleId],
    queryFn: async () => {
      const { data } = await api.get<Article>(`/spaces/articles/${articleId}`)
      return data
    },
    enabled: Boolean(articleId),
  })
}

export function useUpdateArticle(articleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title?: string; content?: unknown }) => {
      const { data } = await api.patch<Article>(
        `/spaces/articles/${articleId}`,
        input,
      )
      return data
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['articles', articleId] }),
  })
}
