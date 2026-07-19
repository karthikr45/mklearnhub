import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  fetchPortal,
  PortalDocument,
  portalSeo,
} from '@/components/builder/PortalDocument'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ portalId: string }>
}): Promise<Metadata> {
  const { portalId } = await params
  return portalSeo(await fetchPortal(`/portals/public/${portalId}`))
}

export default async function PublicPortalPage({
  params,
}: {
  params: Promise<{ portalId: string }>
}) {
  const { portalId } = await params
  const data = await fetchPortal(`/portals/public/${portalId}`)
  if (!data) notFound()
  return <PortalDocument data={data} />
}
