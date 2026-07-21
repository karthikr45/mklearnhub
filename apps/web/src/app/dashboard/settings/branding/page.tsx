'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Globe, Loader2, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface BrandingResponse {
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  customDomain?: string
  customCss?: string
  hideLearnhubBranding?: boolean
}

const FONTS = ['Inter', 'Poppins', 'DM Sans', 'Lato', 'Nunito']

export default function BrandingPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)
  const queryClient = useQueryClient()

  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#4f46e5')
  const [secondaryColor, setSecondaryColor] = useState('#0ea5e9')
  const [accentColor, setAccentColor] = useState('#f59e0b')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [customDomain, setCustomDomain] = useState('')
  const [customCss, setCustomCss] = useState('')
  const [hideBranding, setHideBranding] = useState(false)

  const { data } = useQuery({
    queryKey: ['branding', orgId],
    queryFn: async () => {
      const { data } = await api.get<BrandingResponse>('/branding')
      return data
    },
    enabled: Boolean(orgId),
  })

  useEffect(() => {
    if (!data) return
    if (data.logoUrl) setLogoUrl(data.logoUrl)
    if (data.primaryColor) setPrimaryColor(data.primaryColor)
    if (data.secondaryColor) setSecondaryColor(data.secondaryColor)
    if (data.accentColor) setAccentColor(data.accentColor)
    if (data.fontFamily) setFontFamily(data.fontFamily)
    if (data.customDomain) setCustomDomain(data.customDomain)
    if (data.customCss) setCustomCss(data.customCss)
    if (typeof data.hideLearnhubBranding === 'boolean')
      setHideBranding(data.hideLearnhubBranding)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: BrandingResponse = {
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        hideLearnhubBranding: hideBranding,
      }
      if (logoUrl) payload.logoUrl = logoUrl
      if (customDomain) payload.customDomain = customDomain
      if (customCss) payload.customCss = customCss
      await api.post('/branding', payload)
    },
    onSuccess: () => {
      toast.success('Branding saved')
      void queryClient.invalidateQueries({ queryKey: ['branding', orgId] })
    },
    onError: () => toast.error('Could not save branding'),
  })

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ verified: boolean }>(
        '/branding/verify-domain',
        { domain: customDomain },
      )
      return data.verified
    },
    onSuccess: (verified) => {
      if (verified) toast.success('Domain verified')
      else toast.error('DNS records not found yet')
    },
    onError: () => toast.error('Could not verify domain'),
  })

  const previewStyle = {
    fontFamily,
    '--preview-primary': primaryColor,
    '--preview-secondary': secondaryColor,
    '--preview-accent': accentColor,
  } as React.CSSProperties

  return (
    <div>
      <PageHeader
        title="Branding"
        description="Logo, colors, fonts, and custom domain."
        action={
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!orgId || saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Palette className="h-4 w-4" />
            )}
            Save
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="mb-4 font-semibold">Logo</h3>
            <label className="text-xs font-medium text-muted-foreground">
              Logo URL
            </label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://cdn.example.com/logo.svg"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {logoUrl ? (
              <div className="mt-4 flex h-20 items-center justify-center rounded-md border bg-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="max-h-16 max-w-full object-contain"
                />
              </div>
            ) : null}
          </div>

          <div className="card-elevated p-6">
            <h3 className="mb-4 font-semibold">Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <ColorField
                label="Primary"
                value={primaryColor}
                onChange={setPrimaryColor}
              />
              <ColorField
                label="Secondary"
                value={secondaryColor}
                onChange={setSecondaryColor}
              />
              <ColorField
                label="Accent"
                value={accentColor}
                onChange={setAccentColor}
              />
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="mb-4 font-semibold">Typography</h3>
            <label className="text-xs font-medium text-muted-foreground">
              Font family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="card-elevated p-6">
            <h3 className="mb-4 font-semibold">Custom domain</h3>
            <label className="text-xs font-medium text-muted-foreground">
              Domain
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="learn.yourcompany.com"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={!customDomain || verifyMutation.isPending}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Verify DNS
              </button>
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="mb-4 font-semibold">Custom CSS</h3>
            <textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              rows={6}
              placeholder=".learnhub-header { border-radius: 0; }"
              className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between card-elevated p-6">
            <div>
              <h3 className="font-semibold">Hide LearnHub branding</h3>
              <p className="text-sm text-muted-foreground">
                Remove &ldquo;Powered by LearnHub&rdquo; from your portal.
              </p>
            </div>
            <button
              onClick={() => setHideBranding((v) => !v)}
              aria-pressed={hideBranding}
              className={
                hideBranding
                  ? 'relative h-6 w-11 rounded-full bg-primary transition-colors'
                  : 'relative h-6 w-11 rounded-full bg-muted transition-colors'
              }
            >
              <span
                className={
                  hideBranding
                    ? 'absolute top-0.5 h-5 w-5 translate-x-5 rounded-full bg-background transition-transform'
                    : 'absolute top-0.5 h-5 w-5 translate-x-0.5 rounded-full bg-background transition-transform'
                }
              />
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card-elevated p-6">
            <h3 className="mb-4 font-semibold">Live preview</h3>
            <div
              style={previewStyle}
              className="overflow-hidden rounded-lg border"
            >
              <div
                className="flex items-center gap-3 p-4"
                style={{ backgroundColor: 'var(--preview-primary)' }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="font-semibold text-white">
                    {data?.customDomain ?? 'Your Academy'}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-5">
                <h4 className="text-lg font-semibold">Welcome back</h4>
                <p className="text-sm text-muted-foreground">
                  Continue your learning journey.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--preview-primary)' }}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--preview-secondary)' }}
                  >
                    Secondary
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--preview-accent)' }}
                  >
                    Accent
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Font: {fontFamily}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border bg-background p-0.5"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
        />
      </div>
    </div>
  )
}
