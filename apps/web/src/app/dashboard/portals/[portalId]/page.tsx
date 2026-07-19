'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Data } from '@measured/puck'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { brandingStyle, type BrandingInput } from '@/lib/branding-style'
import { emptyPortalData, type PortalMetadata } from '@/lib/puck.config'

// Puck touches `window`, so it must never render on the server.
const PortalEditor = dynamic(
  () => import('@/components/builder/PortalEditor').then((m) => m.PortalEditor),
  {
    ssr: false,
    loading: () => <p className="p-6 text-sm text-muted-foreground">Loading builder…</p>,
  },
)

interface Portal {
  id: string
  name: string
  slug: string
  isPublic: boolean
  pageJson: Data | null
  primaryColor?: string | null
  logoUrl?: string | null
  organization?: { slug: string }
}

type BuilderData = PortalMetadata & {
  branding?:
    | (BrandingInput & { appName?: string | null; logoUrl?: string | null })
    | null
}

export default function PortalBuilderPage() {
  const params = useParams()
  const portalId = String(params.portalId)
  const qc = useQueryClient()

  const { data: portal, isLoading } = useQuery({
    queryKey: ['portal', portalId],
    queryFn: async () => {
      const { data } = await api.get<Portal>(`/portals/${portalId}`)
      return data
    },
  })

  const { data: meta } = useQuery({
    queryKey: ['portal-data', portalId],
    queryFn: async () => {
      const { data } = await api.get<BuilderData>(`/portals/${portalId}/data`)
      return data
    },
  })

  const togglePublic = useMutation({
    mutationFn: async (isPublic: boolean) => {
      await api.patch(`/portals/${portalId}`, { isPublic })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', portalId] })
      toast.success('Portal visibility updated')
    },
    onError: () => toast.error('Only an org admin can publish'),
  })

  const savePage = async (data: Data) => {
    try {
      await api.put(`/portals/${portalId}/page`, { pageJson: data })
      toast.success('Page saved')
    } catch {
      toast.error('Could not save (org admin only)')
    }
  }

  if (isLoading || !portal) {
    return <p className="text-sm text-muted-foreground">Loading portal…</p>
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/portals"
            className="rounded-md p-1.5 hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium">{portal.name}</span>
          <span className="text-xs text-muted-foreground">
            Drag blocks in, then click <strong>Publish</strong> to save the page.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {portal.isPublic ? (
            <a
              href={
                portal.organization
                  ? `/portal/${portal.organization.slug}/${portal.slug}`
                  : `/p/${portalId}`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View public <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <button
            onClick={() => togglePublic.mutate(!portal.isPublic)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              portal.isPublic
                ? 'border'
                : 'bg-green-600 text-white'
            }`}
          >
            {portal.isPublic ? 'Unpublish' : 'Make public'}
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1"
        style={brandingStyle({
          primaryColor: portal.primaryColor ?? meta?.branding?.primaryColor,
          secondaryColor: meta?.branding?.secondaryColor,
          accentColor: meta?.branding?.accentColor,
          fontFamily: meta?.branding?.fontFamily,
        })}
      >
        <PortalEditor
          initialData={portal.pageJson ?? emptyPortalData}
          metadata={{
            courses: meta?.courses ?? [],
            articles: meta?.articles ?? [],
            logoUrl: portal.logoUrl ?? meta?.branding?.logoUrl ?? null,
            appName: meta?.branding?.appName ?? portal.name,
          }}
          onPublish={savePage}
        />
      </div>
    </div>
  )
}
