import type { Data } from '@measured/puck'
import { Render } from '@measured/puck/rsc'

import { brandingStyle, type BrandingInput } from '@/lib/branding-style'
import { portalConfig, type PortalMetadata } from '@/lib/puck.config'

export interface PublicPortalPayload {
  portal: { name: string; logoUrl?: string | null; primaryColor?: string | null }
  pageJson: Data | null
  branding?: BrandingInput | null
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
  // Portal-level colour overrides the org branding; org branding supplies the
  // rest (secondary/accent/font). Falls back to the default theme.
  const style = brandingStyle({
    primaryColor: data.portal.primaryColor ?? data.branding?.primaryColor,
    secondaryColor: data.branding?.secondaryColor,
    accentColor: data.branding?.accentColor,
    fontFamily: data.branding?.fontFamily,
  })
  return (
    <main style={style} className="bg-background text-foreground">
      <Render config={portalConfig} data={pageData} metadata={metadata} />
    </main>
  )
}
