import type { Data } from '@measured/puck'
import { Render } from '@measured/puck/rsc'

import { portalConfig, type PortalMetadata } from '@/lib/puck.config'

export interface PublicPortalPayload {
  portal: { name: string; logoUrl?: string | null }
  pageJson: Data | null
  courses: PortalMetadata['courses']
  articles: PortalMetadata['articles']
}

export async function fetchPortal(
  path: string,
): Promise<PublicPortalPayload | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try {
    const res = await fetch(`${base}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as PublicPortalPayload
  } catch {
    return null
  }
}

/** Server component that renders a portal's Puck document with live data. */
export function PortalDocument({ data }: { data: PublicPortalPayload }) {
  const pageData: Data = data.pageJson ?? { content: [], root: {} }
  const metadata: PortalMetadata = {
    courses: data.courses ?? [],
    articles: data.articles ?? [],
  }
  return (
    <main>
      <Render config={portalConfig} data={pageData} metadata={metadata} />
    </main>
  )
}
