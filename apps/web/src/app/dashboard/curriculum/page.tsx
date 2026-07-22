'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronRight, GraduationCap, Layers } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

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
  const { data, isLoading } = useQuery({
    queryKey: ['curriculum-tree'],
    queryFn: async () => (await api.get<Tree>('/curriculum/tree')).data,
  })
  const [openSubject, setOpenSubject] = useState<string | null>(null)
  const [openChapter, setOpenChapter] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        title="Curriculum"
        description="Browse the curriculum tree. Content you upload in Content Studio maps to these chapters and topics."
      />

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
              <h2 className="mb-3 flex items-center gap-1.5 text-lg font-semibold">
                <GraduationCap className="h-5 w-5 text-primary" /> {grade.name}
              </h2>
              <div className="space-y-2">
                {grade.subjects.map((subject) => {
                  const open = openSubject === subject.id
                  const byUnit = (chId: string) => subject.units.find((u) => u.id === chId)?.title
                  const byBook = (chId: string) => subject.books.find((b) => b.id === chId)?.title
                  return (
                    <div key={subject.id} className="card-elevated overflow-hidden">
                      <button
                        onClick={() => setOpenSubject(open ? null : subject.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-accent/50"
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
                      {open && (
                        <div className="border-t p-3">
                          <ul className="space-y-1">
                            {subject.chapters.map((ch, i) => {
                              const cOpen = openChapter === ch.id
                              const group = (ch.unitId && byUnit(ch.unitId)) || (ch.bookId && byBook(ch.bookId))
                              return (
                                <li key={ch.id} className="rounded-md">
                                  <button
                                    onClick={() => setOpenChapter(cOpen ? null : ch.id)}
                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent/50"
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
                                    {ch.topics.length > 0 && (
                                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${cOpen ? 'rotate-90' : ''}`} />
                                    )}
                                  </button>
                                  {cOpen && ch.topics.length > 0 && (
                                    <ul className="ml-6 mt-1 space-y-1 border-l pl-3">
                                      {ch.topics.map((t) => (
                                        <li key={t.id} className="py-1 text-sm text-muted-foreground">
                                          {t.title}
                                        </li>
                                      ))}
                                    </ul>
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
