import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAIN = 'learnhub.com'

/**
 * Multi-tenant edge middleware.
 *
 * - `*.learnhub.com` subdomains are resolved to an org slug and forwarded via
 *   the `x-org-slug` request header.
 * - Any other non-local host is treated as a customer custom domain and
 *   forwarded via the `x-custom-domain` header.
 *
 * This runs on the edge and is intentionally side-effect free. In production a
 * fetch() here would resolve the org's branding + SSO configuration and could
 * issue an SSO redirect; we keep it header-only for local development.
 */
export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? ''
  const hostname = host.split(':')[0] ?? ''

  const requestHeaders = new Headers(request.headers)

  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')

  if (!isLocal) {
    if (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      const subdomain = hostname.slice(0, -ROOT_DOMAIN.length - 1)
      // Ignore bare/`www`/`app` hosts — only real tenant subdomains map to slugs.
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        requestHeaders.set('x-org-slug', subdomain)
      }
    } else {
      // Custom domain: production would look up branding + handle SSO redirect.
      requestHeaders.set('x-custom-domain', hostname)
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)'],
}
