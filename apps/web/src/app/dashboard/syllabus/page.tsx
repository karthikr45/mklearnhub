'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  PencilLine,
  PlayCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { ContentViewer } from '@/components/content/ContentViewer'
import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Topic { id: string; title: string }
interface Chapter { id: string; title: string; topics: Topic[] }
interface Subject { id: string; title: string; chapters: Chapter[] }
interface ForMe {
  available: boolean
  reason?: string
  board?: { code: string; name: string } | string
  class?: string | null
  grade?: { id: string; name: string }
  year?: { label: string }
  subjects?: Subject[]
}
interface MappedContent {
  mappingId: string
  section: string
  role: string
  asset: { id: string; title: string; contentType: string; status: string }
}

const SECTION_LABEL: Record<string, string> = {
  LEARN: 'Learn',
  STUDY: 'Study',
  PRACTICE: 'Practice',
  TEST: 'Test',
  OFFICIAL: 'Official resources',
}

/** "Practice" button — appears only when the node has mapped questions. */
function PracticeButton({ nodeType, nodeId }: { nodeType: string; nodeId: string }) {
  const router = useRouter()
  const { data } = useQuery({
    queryKey: ['practice-count', nodeType, nodeId],
    queryFn: async () =>
      (
        await api.get<{ count: number }>(
          `/study/curriculum-practice/${nodeType}/${nodeId}/count`,
        )
      ).data,
  })
  const start = useMutation({
    mutationFn: async () =>
      (
        await api.post<{ attemptId: string }>('/study/curriculum-practice/start', {
          nodeType,
          nodeId,
          limit: 10,
        })
      ).data,
    onSuccess: (d) => router.push(`/dashboard/study/attempt/${d.attemptId}`),
    onError: () => toast.error('Could not start practice'),
  })
  if (!data || data.count === 0) return null
  return (
    <button
      onClick={() => start.mutate()}
      disabled={start.isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
    >
      <PencilLine className="h-3.5 w-3.5" />
      {start.isPending ? 'Starting…' : `Practice (${data.count})`}
    </button>
  )
}

function TopicContent({
  nodeType,
  nodeId,
  onOpen,
  hideWhenEmpty,
}: {
  nodeType: string
  nodeId: string
  onOpen: (assetId: string) => void
  hideWhenEmpty?: boolean
}) {
  const { data } = useQuery({
    queryKey: ['learner-node-content', nodeType, nodeId],
    queryFn: async () =>
      (await api.get<MappedContent[]>(`/curriculum/nodes/${nodeType}/${nodeId}/content`)).data,
  })
  if (!data || data.length === 0) {
    if (hideWhenEmpty) return null
    return <p className="pl-3 text-xs text-muted-foreground">No content yet.</p>
  }
  const bySection = data.reduce<Record<string, MappedContent[]>>((acc, m) => {
    ;(acc[m.section] ??= []).push(m)
    return acc
  }, {})
  return (
    <div className="space-y-2 pl-3">
      {Object.entries(bySection).map(([section, items]) => (
        <ContentSection key={section} section={section} items={items} onOpen={onOpen} />
      ))}
    </div>
  )
}

/**
 * One section (Learn/Study/Practice/Official…) of a node's content. Long lists
 * (e.g. all official NCERT chapter PDFs) collapse behind a toggle so the
 * syllabus stays tidy; short lists stay open.
 */
function ContentSection({
  section,
  items,
  onOpen,
}: {
  section: string
  items: MappedContent[]
  onOpen: (assetId: string) => void
}) {
  const collapsible = items.length > 6
  const [open, setOpen] = useState(!collapsible)
  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${
          collapsible ? 'hover:text-foreground' : 'cursor-default'
        }`}
      >
        {collapsible && (
          <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        )}
        {SECTION_LABEL[section] ?? section}
        {collapsible && <span className="font-normal normal-case">({items.length})</span>}
      </button>
      {open && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {items.map((m) => (
            <button
              key={m.mappingId}
              onClick={() => onOpen(m.asset.id)}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
            >
              {m.asset.contentType === 'VIDEO' ? (
                <PlayCircle className="h-3.5 w-3.5 text-primary" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-primary" />
              )}
              {m.asset.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SyllabusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['curriculum-for-me'],
    queryFn: async () => (await api.get<ForMe>('/curriculum/for-me')).data,
  })
  const [openSubject, setOpenSubject] = useState<string | null>(null)
  const [openChapter, setOpenChapter] = useState<string | null>(null)
  const [viewAsset, setViewAsset] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        title="My Syllabus"
        description="Your board's curriculum, with lessons, notes, practice and tests for each topic."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.available ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          {data?.reason === 'no-profile' ? (
            <>
              <p className="font-medium">Tell us what you&apos;re studying</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Set your board and class so we can show your syllabus.
              </p>
              <Link href="/onboarding" className="mk-brand-bg mt-4 inline-block rounded-md px-4 py-2 text-sm font-medium text-white">
                Set my details
              </Link>
            </>
          ) : (
            <>
              <p className="font-medium">Your syllabus isn&apos;t loaded yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {typeof data?.board === 'string' ? data.board : data?.board?.code ?? 'Your board'}
                {data?.class ? ` · Class ${data.class}` : ''} isn&apos;t available yet. It&apos;s being
                added — check back soon.
              </p>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="mk-brand-bg rounded-full px-3 py-1 font-medium text-white">
              {typeof data.board === 'object' ? data.board?.name : data.board}
            </span>
            {data.grade && <span className="rounded-full bg-secondary px-3 py-1">{data.grade.name}</span>}
            {data.year && <span className="rounded-full bg-secondary px-3 py-1">{data.year.label}</span>}
          </div>

          {data.grade?.id && (
            <div className="mb-4">
              <TopicContent nodeType="GRADE" nodeId={data.grade.id} onOpen={setViewAsset} hideWhenEmpty />
            </div>
          )}

          {(data.subjects ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No subjects published yet.
            </p>
          ) : (
            <div className="space-y-2">
              {data.subjects!.map((subject) => {
                const sOpen = openSubject === subject.id
                return (
                  <div key={subject.id} className="card-elevated overflow-hidden">
                    <button
                      onClick={() => setOpenSubject(sOpen ? null : subject.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-accent/50"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {subject.title}
                        <span className="text-xs font-normal text-muted-foreground">
                          {subject.chapters.length} chapters
                        </span>
                      </span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${sOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {sOpen && (
                      <ul className="border-t p-2">
                        <li className="px-1 pb-1">
                          <TopicContent nodeType="SUBJECT" nodeId={subject.id} onOpen={setViewAsset} hideWhenEmpty />
                        </li>
                        {subject.chapters.map((ch, i) => {
                          const cOpen = openChapter === ch.id
                          return (
                            <li key={ch.id}>
                              <button
                                onClick={() => setOpenChapter(cOpen ? null : ch.id)}
                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent/50"
                              >
                                <span><span className="text-muted-foreground">{i + 1}. </span>{ch.title}</span>
                                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${cOpen ? 'rotate-90' : ''}`} />
                              </button>
                              {cOpen && (
                                <div className="ml-4 space-y-3 border-l pl-3 pt-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <PracticeButton nodeType="CHAPTER" nodeId={ch.id} />
                                  </div>
                                  <TopicContent nodeType="CHAPTER" nodeId={ch.id} onOpen={setViewAsset} />
                                  {ch.topics.map((t) => (
                                    <div key={t.id}>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium">{t.title}</p>
                                        <PracticeButton nodeType="TOPIC" nodeId={t.id} />
                                      </div>
                                      <div className="mt-1">
                                        <TopicContent nodeType="TOPIC" nodeId={t.id} onOpen={setViewAsset} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {viewAsset && (
        <ContentViewer assetId={viewAsset} onClose={() => setViewAsset(null)} />
      )}
    </div>
  )
}
