import type { AuthUser } from '@learnhub/types'

import { useAuthStore } from './store'

export function getSession(): {
  user: AuthUser | null
  accessToken: string | null
} {
  const { user, accessToken } = useAuthStore.getState()
  return { user, accessToken }
}

export function isAuthenticated(): boolean {
  return Boolean(useAuthStore.getState().accessToken)
}
