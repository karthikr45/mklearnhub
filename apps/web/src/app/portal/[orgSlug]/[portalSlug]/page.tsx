import { notFound } from 'next/navigation'

import {
  fetchPortal,
  PortalDocument,
} from '@/components/builder/PortalDocument'

export const dynamic = 'force-dynamic'

export default async function PublicPortalBySlugPage({
  params,
}: {
  params: Promise<{ orgSlug: string; portalSlug: string }>
}) {
  const { orgSlug, portalSlug } = await params
  const data = await fetchPortal(
    `/portals/public/by-slug/${encodeURIComponent(orgSlug)}/${encodeURIComponent(portalSlug)}`,
  )
  if (!data) notFound()
  return <PortalDocument data={data} />
}
