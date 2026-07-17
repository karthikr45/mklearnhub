'use client'

import type { Course } from '@learnhub/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await api.get<Course[]>('/courses')
      return data
    },
  })
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const { data } = await api.get<Course>(`/courses/${courseId}`)
      return data
    },
    enabled: Boolean(courseId),
  })
}

export function useEnroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post(`/courses/${courseId}/enroll`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}
