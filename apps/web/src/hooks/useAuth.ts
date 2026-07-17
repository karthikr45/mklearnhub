'use client'

import type { AuthTokens, AuthUser } from '@learnhub/types'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

export function useAuth() {
  const router = useRouter()
  const { user, setAuth, clear } = useAuthStore()

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', input)
      return data
    },
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      })
      router.push('/dashboard')
    },
  })

  const register = useMutation({
    mutationFn: async (input: {
      email: string
      password: string
      name: string
      orgName?: string
    }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', input)
      return data
    },
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      })
      router.push('/dashboard')
    },
  })

  const logout = () => {
    clear()
    router.push('/login')
  }

  return { user, login, register, logout }
}
