'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, ChevronRight, Download, FileUp, GraduationCap, Layers, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { OfficialResourcesPanel } from '@/components/curriculum/OfficialResourcesPanel'
import { QuestionManager } from '@/components/curriculum/QuestionManager'
import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

const CSV_TEMPLATE = `board,board_name,year,grade,subject,unit,book,chapter,topic
CBSE,CBSE,2026-27,Grade 10,Science,,,Chemical Reactions and Equations,Chemical Equations
CBSE,CBSE,2026-27,Grade 10,Science,,,Chemical Reactions and Equations,Types of Chemical Reactions
CBSE,CBSE,2026-27,Grade 10,Mathematics,Algebra,,Quadratic Equations,
CBSE,CBSE,2026-27,Grade 10,Hindi,,क्षितिज भाग-2 (Kshitij),कबीर – साखी,
`

interface ImportResult {
  rows: number
  boards: number
  subjects: number
  chapters: number
  topics: number
  errors: { line: number; message: string }[]
}

function ImportPanel() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const download = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'curriculum-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const run = async () => {
    if (!csv.trim()) return
    setBusy(true)
    setResult(null)
    try {
      const { data } = await api.post<ImportResult>('/curriculum/import', { csv })
      setResult(data)
      await qc.invalidateQueries({ queryKey: ['curriculum-tree'] })
      toast.success(`Imported ${data.chapters} chapters, ${data.topics} topics`)
    } catch {
      toast.error('Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-6 card-elevated p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        <span className="flex items-center gap-1.5">
          <FileUp className="h-4 w-4 text-primary" /> Import a verified syllabus (CSV)
        </span>
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            The authoritative way to load an exact syllabus. Columns:
            <code className="mx-1 rounded bg-muted px-1">board, board_name, year, grade, subject, unit, book, chapter, topic</code>
            (board, year, grade, subject, chapter required). Re-importing the same file is safe (idempotent).
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-accent">
              <Download className="h-3.5 w-3.5" /> Download template
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-accent">
              <Upload className="h-3.5 w-3.5" /> Load .csv file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) setCsv(await f.text())
                }}
              />
            </label>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Paste CSV here, or load a .csv file…"
            rows={6}
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
          />
          <button
            onClick={run}
            disabled={busy || !csv.trim()}
            className="mk-brand-bg rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Importing…' : 'Import'}
          </button>
          {result && (
            <div className="rounded-lg border bg-muted/20 p-3 text-xs">
              <p className="font-medium">
                {result.rows} rows · {result.chapters} chapters · {result.topics} topics ·{' '}
                {result.subjects} subjects
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-destructive">
                  {result.errors.slice(0, 10).map((er, i) => (
                    <li key={i}>Line {er.line}: {er.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface MappedContent {
  mappingId: string
  section: string
  role: string
  asset: { id: string; title: string; contentType: string; status: string }
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  LICENSE_REVIEW: 'bg-amber-100 text-amber-700',
  DRAFT: 'bg-secondary text-muted-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
  REJECTED: 'bg-destructive/10 text-destructive',
}

/** Coverage chips: what content is mapped to a curriculum node + its status. */
function NodeCoverage({
  nodeType,
  nodeId,
  label,
}: {
  nodeType: string
  nodeId: string
  label?: string
}) {
  const { data } = useQuery({
    queryKey: ['node-content', nodeType, nodeId],
    queryFn: async () =>
      (await api.get<MappedContent[]>(`/curriculum/nodes/${nodeType}/${nodeId}/content?all=true`)).data,
  })
  if (!data || data.length === 0) {
    return label ? null : (
      <span className="text-[11px] text-muted-foreground">No content yet</span>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      {label && <span className="text-[11px] font-medium text-muted-foreground">{label}:</span>}
      {data.map((m) => (
        <span
          key={m.mappingId}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[m.asset.status] ?? 'bg-secondary'}`}
          title={`${m.asset.title} · ${m.section}`}
        >
          {m.role} · {m.asset.status}
        </span>
      ))}
    </div>
  )
}

function NodeAction({
  icon: Icon,
  title,
  onClick,
  danger,
}: {
  icon: typeof Pencil
  title: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded p-1.5 text-muted-foreground transition hover:bg-background ${
        danger ? 'hover:text-destructive' : 'hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

interface Topic { id: string; title: string }
interface Chapter { id: string; title: string; unitId: string | null; bookId: string | null; topics: Topic[] }
interface Unit { id: string; title: string }
interface Book { id: string; title: string }
interface Subject { id: string; title: string; units: Unit[]; books: Book[]; chapters: Chapter[] }
interface Grade { id: string; name: string; subjects: Subject[] }
interface Tree {
  board: { id: string; name: string } | null
  year: { id: string; label: string } | null
  grades: Grade[]
}

export default function CurriculumPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['curriculum-tree'],
    queryFn: async () => (await api.get<Tree>('/curriculum/tree')).data,
  })
  const [openSubject, setOpenSubject] = useState<string | null>(null)
  const [openChapter, setOpenChapter] = useState<string | null>(null)

  const refresh = () => qc.invalidateQueries({ queryKey: ['curriculum-tree'] })
  const addNode = async (type: string, parentId: string, label: string) => {
    const title = window.prompt(`New ${label} name`)?.trim()
    if (!title) return
    try {
      await api.post(`/curriculum/nodes/${type}`, { parentId, title })
      refresh()
      toast.success(`${label} added`)
    } catch {
      toast.error(`Could not add ${label}`)
    }
  }
  const renameNode = async (type: string, id: string, current: string) => {
    const title = window.prompt('Rename', current)?.trim()
    if (!title || title === current) return
    try {
      await api.patch(`/curriculum/nodes/${type}/${id}`, { title })
      refresh()
      toast.success('Renamed')
    } catch {
      toast.error('Could not rename')
    }
  }
  const deleteNode = async (type: string, id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This also removes everything under it.`)) return
    try {
      await api.delete(`/curriculum/nodes/${type}/${id}`)
      refresh()
      toast.success('Deleted')
    } catch {
      toast.error('Could not delete')
    }
  }

  return (
    <div>
      <PageHeader
        title="Curriculum"
        description="Browse the curriculum tree. Content you upload in Content Studio maps to these chapters and topics."
      />

      <ImportPanel />

      <div className="mt-4">
        <OfficialResourcesPanel />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.board ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No curriculum yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-1">pnpm db:seed:curriculum</code> to load CBSE Grade 10.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-center gap-2 text-sm">
            <span className="mk-brand-bg rounded-full px-3 py-1 font-medium text-white">
              {data.board.name}
            </span>
            {data.year && (
              <span className="rounded-full bg-secondary px-3 py-1">{data.year.label}</span>
            )}
          </div>

          {data.grades.map((grade) => (
            <section key={grade.id} className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-lg font-semibold">
                  <GraduationCap className="h-5 w-5 text-primary" /> {grade.name}
                </h2>
                <button
                  onClick={() => addNode('subject', grade.id, 'subject')}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <Plus className="h-3.5 w-3.5" /> Add subject
                </button>
              </div>
              <div className="space-y-2">
                {grade.subjects.map((subject) => {
                  const open = openSubject === subject.id
                  const byUnit = (chId: string) => subject.units.find((u) => u.id === chId)?.title
                  const byBook = (chId: string) => subject.books.find((b) => b.id === chId)?.title
                  return (
                    <div key={subject.id} className="card-elevated overflow-hidden">
                      <div className="flex items-center hover:bg-accent/50">
                        <button
                          onClick={() => setOpenSubject(open ? null : subject.id)}
                          className="flex flex-1 items-center justify-between px-4 py-3 text-left font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {subject.title}
                            <span className="text-xs font-normal text-muted-foreground">
                              {subject.chapters.length} chapters
                            </span>
                          </span>
                          <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                        </button>
                        <div className="flex items-center gap-1 pr-3">
                          <NodeAction icon={Plus} title="Add chapter" onClick={() => addNode('chapter', subject.id, 'chapter')} />
                          <NodeAction icon={Pencil} title="Rename subject" onClick={() => renameNode('subject', subject.id, subject.title)} />
                          <NodeAction icon={Trash2} title="Delete subject" danger onClick={() => deleteNode('subject', subject.id, subject.title)} />
                        </div>
                      </div>
                      {open && (
                        <div className="border-t p-3">
                          <ul className="space-y-1">
                            {subject.chapters.map((ch, i) => {
                              const cOpen = openChapter === ch.id
                              const group = (ch.unitId && byUnit(ch.unitId)) || (ch.bookId && byBook(ch.bookId))
                              return (
                                <li key={ch.id} className="rounded-md">
                                  <div className="flex items-center rounded-md hover:bg-accent/50">
                                    <button
                                      onClick={() => setOpenChapter(cOpen ? null : ch.id)}
                                      className="flex flex-1 items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                                    >
                                      <span>
                                        <span className="text-muted-foreground">{i + 1}. </span>
                                        {ch.title}
                                        {group && (
                                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                                            {group}
                                          </span>
                                        )}
                                      </span>
                                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${cOpen ? 'rotate-90' : ''}`} />
                                    </button>
                                    <div className="flex items-center gap-1 pr-2">
                                      <NodeAction icon={Plus} title="Add topic" onClick={() => addNode('topic', ch.id, 'topic')} />
                                      <NodeAction icon={Pencil} title="Rename chapter" onClick={() => renameNode('chapter', ch.id, ch.title)} />
                                      <NodeAction icon={Trash2} title="Delete chapter" danger onClick={() => deleteNode('chapter', ch.id, ch.title)} />
                                    </div>
                                  </div>
                                  {cOpen && (
                                    <div className="ml-6 mt-1 space-y-2 border-l pl-3">
                                      <NodeCoverage nodeType="CHAPTER" nodeId={ch.id} label="Chapter content" />
                                      <QuestionManager nodeType="CHAPTER" nodeId={ch.id} />
                                      {ch.topics.map((t) => (
                                        <div key={t.id}>
                                          <div className="flex items-center gap-1">
                                            <p className="flex-1 py-1 text-sm">{t.title}</p>
                                            <NodeAction icon={Pencil} title="Rename topic" onClick={() => renameNode('topic', t.id, t.title)} />
                                            <NodeAction icon={Trash2} title="Delete topic" danger onClick={() => deleteNode('topic', t.id, t.title)} />
                                          </div>
                                          <div className="pl-3">
                                            <NodeCoverage nodeType="TOPIC" nodeId={t.id} />
                                            <QuestionManager nodeType="TOPIC" nodeId={t.id} />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
