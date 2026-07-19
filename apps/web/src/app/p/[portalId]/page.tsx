import type { Data } from '@measured/puck'
import { Render } from '@measured/puck/rsc'
import { notFound } from 'next/navigation'

import { portalConfig, type PortalMetadata } from '@/lib/puck.config'

export const dynamic = 'force-dynamic'

interface PublicPortal {
  portal: { name: string; logoUrl?: string | null }
  pageJson: Data | null
  courses: PortalMetadata['courses']
  articles: PortalMetadata['articles']
}

async function fetchPortal(id: string): Promise<PublicPortal | null> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try {
    const res = await fetch(`${base}/portals/public/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as PublicPortal
  } catch {
    return null
  }
}

export default async function PublicPortalPage({
  params,
}: {
  params: Promise<{ portalId: string }>
}) {
  const { portalId } = await params
  const data = await fetchPortal(portalId)
  if (!data) notFound()

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
