export interface RateLimitConfig {
  /** Max requests allowed within the window. */
  limit: number
  /** Window length in seconds. */
  windowSecs: number
  /** What the limit is keyed by. */
  by: 'ip' | 'apiKey' | 'user'
  description: string
}

export const RATE_LIMITS = {
  AUTH_ENDPOINTS: {
    limit: 10,
    windowSecs: 15 * 60,
    by: 'ip',
    description: 'Brute-force protection on auth endpoints',
  },
  API_ENDPOINTS: {
    limit: 1000,
    windowSecs: 60 * 60,
    by: 'apiKey',
    description: 'Default public API rate limit',
  },
  UPLOAD_ENDPOINTS: {
    limit: 20,
    windowSecs: 60 * 60,
    by: 'user',
    description: 'Upload throttling per user',
  },
  PUBLIC_ENDPOINTS: {
    limit: 100,
    windowSecs: 60,
    by: 'ip',
    description: 'Unauthenticated public endpoints',
  },
} satisfies Record<string, RateLimitConfig>

export type RateLimitPreset = keyof typeof RATE_LIMITS
