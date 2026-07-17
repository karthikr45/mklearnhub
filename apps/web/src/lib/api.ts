import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from './store'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<{
      accessToken: string
      refreshToken: string
    }>(`${API_URL}/auth/refresh`, { refreshToken })
    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    clear()
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? refreshAccessToken()
      const token = await refreshing
      refreshing = null
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`)
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)
