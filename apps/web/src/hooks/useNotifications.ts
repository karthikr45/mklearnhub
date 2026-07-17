'use client'

import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

export interface Notification {
  id: string
  type: string
  title: string
  body?: string | null
  isRead: boolean
  createdAt: string
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>('/notifications/unread')
      return data
    },
    refetchInterval: 60_000,
  })
}
