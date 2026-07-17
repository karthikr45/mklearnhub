export interface SecurityHeaderOptions {
  isProduction?: boolean
  /** Extra CSP connect-src origins (e.g. the API URL for the web app). */
  connectSrc?: string[]
}

/**
 * Returns a map of recommended security headers for Fastify / Next.js.
 * CSP is relaxed in non-production to keep local dev (Swagger, HMR) working.
 */
export function securityHeaders(
  options: SecurityHeaderOptions = {},
): Record<string, string> {
  const { isProduction = false, connectSrc = [] } = options

  const connect = ["'self'", ...connectSrc].join(' ')
  const csp = [
    "default-src 'self'",
    isProduction
      ? "script-src 'self'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  if (isProduction) {
    headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubDomains; preload'
  }

  return headers
}
