'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import {
  BookOpen,
  ChevronRight,
  FileUp,
  Link2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
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

interface OverviewItem {
  id: string
  title: string
  contentType: string
  status: string
  sourceType: string
}
interface OverviewSubject {
  id: string
  title: string
  total: number
  published: number
  items: OverviewItem[]
}
interface ContentOverview {
  grade: { id: string; name: string } | null
  subjects: OverviewSubject[]
  gradeItems: OverviewItem[]
}

interface TreeTopic { id: string; title: string }
interface TreeChapter { id: string; title: string; topics: TreeTopic[] }
interface TreeSubject { id: string; title: string; chapters: TreeChapter[] }
interface CurriculumTree { grades: { subjects: TreeSubject[] }[] }

const SECTIONS = ['LEARN', 'STUDY', 'PRACTICE', 'TEST', 'OFFICIAL']
const ROLE_PRESETS = ['VIDEO', 'EXPLANATION', 'NOTES', 'REVISION', 'KEY_CONCEPTS', 'MCQ', 'WORKSHEET', 'SOLUTION']

export default function ContentStudioPage() {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('PDF')
  const [sourceType, setSourceType] = useState('ORIGINAL')
  const [file, setFile] = useState<File | null>(null)
  const [selfHost, setSelfHost] = useState(false)
  const [commercial, setCommercial] = useState(false)
  const [verified, setVerified] = useState(false)
  const [officialAck, setOfficialAck] = useState(false)
  const [sourceName, setSourceName] = useState('')
  const [licenseUrl, setLicenseUrl] = useState('')
  const [busy, setBusy] = useState(false)

  const { data } = useQuery({
    queryKey: ['content-assets'],
    queryFn: async () =>
      (await api.get<{ items: Asset[]; total: number }>('/content?take=100')).data,
  })

  // Grade → subject organised view of all mapped content.
  const { data: overview } = useQuery({
    queryKey: ['content-overview'],
    queryFn: async () =>
      (await api.get<ContentOverview>('/curriculum/content-overview')).data,
  })
  const [openSubj, setOpenSubj] = useState<string | null>(null)

  // Curriculum tree for the map-to-topic picker
  const { data: tree } = useQuery({
    queryKey: ['curriculum-tree-min'],
    queryFn: async () => (await api.get<CurriculumTree>('/curriculum/tree')).data,
  })
  const subjects = tree?.grades?.[0]?.subjects ?? []

  const [mapFor, setMapFor] = useState<string | null>(null)
  const [mSubject, setMSubject] = useState('')
  const [mChapter, setMChapter] = useState('')
  const [mTopic, setMTopic] = useState('')
  const [mSection, setMSection] = useState('LEARN')
  const [mRole, setMRole] = useState('VIDEO')

  const chapters = subjects.find((s) => s.id === mSubject)?.chapters ?? []
  const topics = chapters.find((c) => c.id === mChapter)?.topics ?? []

  const saveMapping = async (assetId: string) => {
    const nodeId = mTopic || mChapter || mSubject
    const nodeType = mTopic ? 'TOPIC' : mChapter ? 'CHAPTER' : 'SUBJECT'
    if (!nodeId) {
      toast.error('Pick at least a subject')
      return
    }
    try {
      await api.post(`/content/${assetId}/mappings`, {
        nodeType,
        nodeId,
        section: mSection,
        role: mRole.trim() || 'GENERAL',
      })
      toast.success('Mapped to curriculum')
      setMapFor(null)
      void qc.invalidateQueries({ queryKey: ['curriculum-tree'] })
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string })?.message ?? 'Mapping failed'
          : 'Mapping failed'
      toast.error(msg)
    }
  }

  const refreshAssets = () => {
    void qc.invalidateQueries({ queryKey: ['content-assets'] })
    void qc.invalidateQueries({ queryKey: ['content-overview'] })
  }
  const workflow = async (id: string, action: 'review' | 'approve' | 'publish' | 'archive') => {
    try {
      await api.post(`/content/${id}/${action}`)
      refreshAssets()
      toast.success(action === 'archive' ? 'Unpublished' : `Moved to ${action}`)
    } catch (err) {
      const msg = err instanceof AxiosError ? (err.response?.data as { message?: string })?.message : undefined
      toast.error(msg ?? 'Action failed')
    }
  }
  const renameAsset = async (id: string, current: string) => {
    const title = window.prompt('Rename content', current)?.trim()
    if (!title || title === current) return
    try {
      await api.patch(`/content/${id}`, { title })
      refreshAssets()
      toast.success('Renamed')
    } catch {
      toast.error('Could not rename')
    }
  }
  const deleteAsset = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This also removes it from any curriculum mapping and storage.`)) return
    try {
      await api.delete(`/content/${id}`)
      refreshAssets()
      toast.success('Deleted')
    } catch {
      toast.error('Could not delete')
    }
  }

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
        ...(isExternalOnly
          ? {
              officialHostingAcknowledged: officialAck,
              attributionRequired: true,
              sourceName: sourceName || 'NCERT',
              attributionText: `Source: ${sourceName || 'NCERT'}`,
            }
          : isThirdParty
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

      // 4) For official NCERT files, auto-map to the recognised chapter + publish
      let mapped = ''
      if (isExternalOnly) {
        try {
          const { data: rec } = await api.get<{
            recognized: boolean
            subject?: string
            chapterTitle?: string | null
            nodeType?: string | null
            nodeId?: string | null
          }>(`/curriculum/official/ncert-file?name=${encodeURIComponent(file.name)}`)
          if (rec.recognized && rec.nodeId && rec.nodeType) {
            await api.post(`/content/${presign.assetId}/mappings`, {
              nodeType: rec.nodeType,
              nodeId: rec.nodeId,
              section: 'OFFICIAL',
              role: 'OFFICIAL_TEXTBOOK',
            })
            await api.post(`/content/${presign.assetId}/publish`).catch(() => {})
            mapped = rec.chapterTitle
              ? ` → mapped to ${rec.subject}: ${rec.chapterTitle}`
              : ` → ${rec.subject}`
          }
        } catch {
          /* recognition is best-effort; manual mapping still available */
        }
      }

      toast.success(`Uploaded to storage ✓${mapped}`)
      setTitle('')
      setFile(null)
      void qc.invalidateQueries({ queryKey: ['content-assets'] })
      void qc.invalidateQueries({ queryKey: ['content-overview'] })
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

      {overview?.grade && (
        <div className="card-elevated mb-6 p-5">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">
              Content by subject — {overview.grade.name}
            </h2>
          </div>
          {overview.gradeItems.length > 0 && (
            <p className="mb-2 text-xs text-muted-foreground">
              {overview.gradeItems.length} grade-wide resource
              {overview.gradeItems.length === 1 ? '' : 's'} (syllabus, papers, portals)
            </p>
          )}
          <div className="space-y-2">
            {overview.subjects.map((s) => {
              const open = openSubj === s.id
              return (
                <div key={s.id} className="rounded-lg border">
                  <button
                    onClick={() => setOpenSubj(open ? null : s.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/50"
                  >
                    <span className="font-medium">{s.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        {s.published} live
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                        {s.total} total
                      </span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                    </span>
                  </button>
                  {open && (
                    <ul className="max-h-80 space-y-1 overflow-auto border-t p-2">
                      {s.items.length === 0 ? (
                        <li className="px-2 py-1 text-xs text-muted-foreground">No content mapped yet.</li>
                      ) : (
                        s.items.map((it) => (
                          <li key={it.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-accent/40">
                            <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {it.contentType.replace(/_/g, ' ')}
                            </span>
                            <span className="flex-1 truncate" title={it.title}>{it.title}</span>
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              it.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-secondary-foreground'
                            }`}>
                              {it.status === 'PUBLISHED' ? 'live' : it.status.toLowerCase()}
                            </span>
                            <button onClick={() => view(it.id)} className="shrink-0 text-primary hover:underline">View</button>
                            <button onClick={() => deleteAsset(it.id, it.title)} className="shrink-0 text-muted-foreground hover:text-destructive">Delete</button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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
              <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="h-3.5 w-3.5" /> Hosting an official resource
                </p>
                <p>
                  Official material (e.g. NCERT) may be hosted only <strong>unchanged</strong>,
                  <strong> attributed</strong>, and for <strong>free</strong>. A “Source” credit is
                  shown to students automatically.
                </p>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Source (e.g. NCERT)"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                />
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={officialAck}
                    onChange={(e) => setOfficialAck(e.target.checked)}
                    className="mt-0.5"
                  />
                  I confirm this is hosted unchanged, credited to the source above, and free.
                </label>
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
              disabled={isExternalOnly && !officialAck}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-50"
            />

            <button
              onClick={upload}
              disabled={busy || (isExternalOnly && !officialAck) || !title.trim() || !file}
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
                <div key={a.id} className="card-elevated p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.contentType.replace(/_/g, ' ')} · {a.sourceType} ·{' '}
                        {a.fileSize ? `${Math.round(a.fileSize / 1024)} KB` : '—'} ·{' '}
                        {a.storageProvider ?? 'no file'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        a.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700'
                        : a.status === 'APPROVED' ? 'bg-blue-100 text-blue-700'
                        : a.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700'
                        : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {a.status}
                      </span>
                      {/* workflow: review → approve → publish → unpublish */}
                      {a.status === 'DRAFT' && (
                        <button onClick={() => workflow(a.id, 'review')} className="text-xs text-primary hover:underline">Send to review</button>
                      )}
                      {a.status === 'UNDER_REVIEW' && (
                        <button onClick={() => workflow(a.id, 'approve')} className="text-xs text-primary hover:underline">Approve</button>
                      )}
                      {a.status === 'APPROVED' && (
                        <button onClick={() => workflow(a.id, 'publish')} className="text-xs font-medium text-emerald-600 hover:underline">Publish</button>
                      )}
                      {a.status === 'PUBLISHED' && (
                        <button onClick={() => workflow(a.id, 'archive')} className="text-xs text-muted-foreground hover:underline">Unpublish</button>
                      )}
                      <button onClick={() => setMapFor(mapFor === a.id ? null : a.id)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Link2 className="h-3.5 w-3.5" /> Map
                      </button>
                      <button onClick={() => view(a.id)} className="text-xs text-primary hover:underline">View</button>
                      <button onClick={() => renameAsset(a.id, a.title)} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Rename</button>
                      <button onClick={() => deleteAsset(a.id, a.title)} className="text-xs text-muted-foreground hover:text-destructive hover:underline">Delete</button>
                    </div>
                  </div>

                  {mapFor === a.id && (
                    <div className="mt-3 grid gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                      <select value={mSubject} onChange={(e) => { setMSubject(e.target.value); setMChapter(''); setMTopic('') }} className="rounded-md border bg-background px-2 py-1.5 text-xs">
                        <option value="">Subject…</option>
                        {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                      <select value={mChapter} onChange={(e) => { setMChapter(e.target.value); setMTopic('') }} disabled={!mSubject} className="rounded-md border bg-background px-2 py-1.5 text-xs disabled:opacity-50">
                        <option value="">Chapter…</option>
                        {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <select value={mTopic} onChange={(e) => setMTopic(e.target.value)} disabled={!mChapter || topics.length === 0} className="rounded-md border bg-background px-2 py-1.5 text-xs disabled:opacity-50">
                        <option value="">{topics.length ? 'Topic (optional)…' : 'No topics'}</option>
                        {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                      <select value={mSection} onChange={(e) => setMSection(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
                        {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input value={mRole} onChange={(e) => setMRole(e.target.value)} list="role-presets" placeholder="Role (e.g. VIDEO)" className="rounded-md border px-2 py-1.5 text-xs" />
                      <datalist id="role-presets">{ROLE_PRESETS.map((r) => <option key={r} value={r} />)}</datalist>
                      <button onClick={() => saveMapping(a.id)} className="mk-brand-bg col-span-full rounded-md px-3 py-1.5 text-xs font-medium text-white">
                        Add to curriculum
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
