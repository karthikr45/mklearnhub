'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { FileUp, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

const CONTENT_TYPES = [
  'PDF', 'VIDEO', 'IMAGE', 'AUDIO', 'DIAGRAM', 'WORKSHEET', 'DETAILED_NOTES',
  'REVISION_NOTES', 'FORMULA_SHEET', 'ANIMATION', 'INTERACTIVE',
]
const SOURCE_TYPES = [
  { value: 'ORIGINAL', label: 'Original (created by us)' },
  { value: 'INTERNAL_GENERATED', label: 'AI-generated (internal)' },
  { value: 'USER_UPLOADED', label: 'User-uploaded (ours by ToS)' },
  { value: 'OPEN_LICENSE', label: 'Open license (CC etc.)' },
  { value: 'LICENSED', label: 'Commercially licensed' },
  { value: 'OFFICIAL_EXTERNAL', label: 'Official external (reference only)' },
]
const OWNED = ['ORIGINAL', 'INTERNAL_GENERATED', 'USER_UPLOADED']

interface Asset {
  id: string
  title: string
  contentType: string
  sourceType: string
  status: string
  fileSize: number | null
  storageProvider: string | null
}

export default function ContentStudioPage() {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('PDF')
  const [sourceType, setSourceType] = useState('ORIGINAL')
  const [file, setFile] = useState<File | null>(null)
  const [selfHost, setSelfHost] = useState(false)
  const [commercial, setCommercial] = useState(false)
  const [verified, setVerified] = useState(false)
  const [sourceName, setSourceName] = useState('')
  const [licenseUrl, setLicenseUrl] = useState('')
  const [busy, setBusy] = useState(false)

  const { data } = useQuery({
    queryKey: ['content-assets'],
    queryFn: async () =>
      (await api.get<{ items: Asset[]; total: number }>('/content')).data,
  })

  const isThirdParty = !OWNED.includes(sourceType)
  const isExternalOnly = sourceType === 'OFFICIAL_EXTERNAL'

  const upload = async () => {
    if (!title.trim() || !file) return
    setBusy(true)
    try {
      // 1) License gate + presigned R2 URL
      const { data: presign } = await api.post<{
        assetId: string
        uploadUrl: string
        storageKey: string
      }>('/content/upload-url', {
        title: title.trim(),
        contentType,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sourceType,
        ...(isThirdParty
          ? {
              selfHostingAllowed: selfHost,
              commercialUseAllowed: commercial,
              licenseVerified: verified,
              ...(sourceName ? { sourceName } : {}),
              ...(licenseUrl ? { licenseUrl } : {}),
            }
          : {}),
      })

      // 2) PUT the file straight to R2 (no auth header — the URL is signed)
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!put.ok) {
        throw new Error(
          `Storage rejected the upload (HTTP ${put.status}). If this is CORS, add a CORS rule to the R2 bucket.`,
        )
      }

      // 3) Confirm the object landed
      await api.post(`/content/${presign.assetId}/complete`, { fileSize: file.size })

      toast.success('Uploaded to storage ✓')
      setTitle('')
      setFile(null)
      void qc.invalidateQueries({ queryKey: ['content-assets'] })
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string })?.message ?? 'Upload failed'
          : err instanceof Error
            ? err.message
            : 'Upload failed'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const view = async (id: string) => {
    try {
      const { data } = await api.get<{ deliveryUrl: string | null }>(`/content/${id}`)
      if (data.deliveryUrl) window.open(data.deliveryUrl, '_blank', 'noopener')
      else toast.error('No file for this asset')
    } catch {
      toast.error('Could not open file')
    }
  }

  return (
    <div>
      <PageHeader
        title="Content Studio"
        description="Upload learning assets to object storage. Licensing is enforced — third-party files are blocked unless self-hosting is permitted."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="card-elevated p-5">
          <h2 className="mb-4 text-sm font-semibold">Upload an asset</h2>
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Balancing Equations — Worksheet)"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Type</span>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Source</span>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {SOURCE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {isExternalOnly ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Official external resources are reference-only and cannot be uploaded
                to storage. Use “Add external reference” instead (coming next).
              </div>
            ) : isThirdParty ? (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> License clearance
                  (required to self-host)
                </p>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Source / owner"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                />
                <input
                  value={licenseUrl}
                  onChange={(e) => setLicenseUrl(e.target.value)}
                  placeholder="License URL"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={selfHost} onChange={(e) => setSelfHost(e.target.checked)} />
                  Self-hosting is explicitly permitted
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={commercial} onChange={(e) => setCommercial(e.target.checked)} />
                  Commercial use is permitted
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
                  I have verified the license
                </label>
              </div>
            ) : null}

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isExternalOnly}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-50"
            />

            <button
              onClick={upload}
              disabled={busy || isExternalOnly || !title.trim() || !file}
              className="mk-brand-bg inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {busy ? 'Uploading…' : 'Upload to storage'}
            </button>
            <p className="text-[11px] text-muted-foreground">
              The file uploads directly from your browser to storage via a signed
              URL. If you get a CORS error, add a CORS rule to the R2 bucket for
              your app origin (PUT).
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Assets ({data?.total ?? 0})
          </h2>
          <div className="space-y-2">
            {(data?.items ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No assets yet. Upload your first one.
              </p>
            ) : (
              data!.items.map((a) => (
                <div key={a.id} className="card-elevated flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.contentType.replace(/_/g, ' ')} · {a.sourceType} ·{' '}
                      {a.fileSize ? `${Math.round(a.fileSize / 1024)} KB` : '—'} ·{' '}
                      {a.storageProvider ?? 'no file'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700'
                      : a.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700'
                      : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {a.status}
                    </span>
                    <button onClick={() => view(a.id)} className="text-xs text-primary hover:underline">
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
