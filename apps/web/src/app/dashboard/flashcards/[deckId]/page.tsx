'use client'

import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { MathText } from '@/components/study/MathText'
import { dueCards, useFlashcards, type Flashcard } from '@/lib/flashcards'

export default function DeckPage() {
  const params = useParams<{ deckId: string }>()
  const deckId = params.deckId
  const search = useSearchParams()
  const decks = useFlashcards((s) => s.decks)
  const addCard = useFlashcards((s) => s.addCard)
  const updateCard = useFlashcards((s) => s.updateCard)
  const deleteCard = useFlashcards((s) => s.deleteCard)

  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'manage' | 'study'>('manage')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  useEffect(() => {
    setMounted(true)
    if (search.get('study')) setMode('study')
  }, [search])

  const deck = decks.find((d) => d.id === deckId)

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!deck) {
    return (
      <div>
        <Link href="/dashboard/flashcards" className="text-sm text-primary hover:underline">
          ← Back to decks
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Deck not found.</p>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/dashboard/flashcards"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All decks
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
          <p className="text-sm text-muted-foreground">
            {deck.subject} · {deck.cards.length} cards
          </p>
        </div>
        <div className="inline-flex rounded-lg border p-0.5">
          {(['manage', 'study'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                mode === m ? 'mk-brand-bg text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === 'study' ? (
        <StudySession deckId={deck.id} />
      ) : (
        <div className="space-y-6">
          <div className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">Add a card</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Tip: wrap math in <code className="rounded bg-muted px-1">$…$</code> for
              LaTeX, e.g. <code className="rounded bg-muted px-1">$E = mc^2$</code>.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!front.trim() || !back.trim()) return
                addCard(deck.id, front.trim(), back.trim())
                setFront('')
                setBack('')
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Front (question)"
                rows={2}
                className="resize-none rounded-md border px-3 py-2 text-sm"
              />
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Back (answer)"
                rows={2}
                className="resize-none rounded-md border px-3 py-2 text-sm"
              />
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={!front.trim() || !back.trim()}
                  className="mk-brand-bg inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add card
                </button>
              </div>
            </form>
          </div>

          {deck.cards.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No cards yet. Add your first card above.
            </p>
          ) : (
            <div className="space-y-2">
              {deck.cards.map((card) => (
                <div key={card.id} className="card-elevated p-4">
                  {editing === card.id ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <textarea
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                        rows={2}
                        className="resize-none rounded-md border px-3 py-2 text-sm"
                      />
                      <textarea
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        rows={2}
                        className="resize-none rounded-md border px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2 sm:col-span-2">
                        <button
                          onClick={() => {
                            updateCard(deck.id, card.id, editFront.trim(), editBack.trim())
                            setEditing(null)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid flex-1 gap-1 sm:grid-cols-2">
                        <div className="text-sm">
                          <MathText text={card.front} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <MathText text={card.back} />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            setEditing(card.id)
                            setEditFront(card.front)
                            setEditBack(card.back)
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Edit card"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCard(deck.id, card.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Delete card"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StudySession({ deckId }: { deckId: string }) {
  const decks = useFlashcards((s) => s.decks)
  const gradeCard = useFlashcards((s) => s.gradeCard)
  const deck = decks.find((d) => d.id === deckId)

  // Snapshot the due queue once when the session starts.
  const [queue, setQueue] = useState<Flashcard[]>([])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const started = useMemo(() => (deck ? dueCards(deck, Date.now()) : []), [deckId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setQueue(started)
    setIdx(0)
    setRevealed(false)
    setDone(0)
  }, [started])

  if (!deck) return null

  if (queue.length === 0) {
    return (
      <div className="card-elevated p-10 text-center">
        <Check className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
        <p className="font-medium">You&apos;re all caught up!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No cards are due right now. Come back later, or add more cards.
        </p>
      </div>
    )
  }

  const card = queue[idx]
  if (!card) {
    return (
      <div className="card-elevated p-10 text-center">
        <Check className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
        <p className="font-medium">Session complete 🎉</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You reviewed {done} card{done === 1 ? '' : 's'}. Nice work!
        </p>
      </div>
    )
  }

  const grade = (g: 'again' | 'good' | 'easy') => {
    gradeCard(deck.id, card.id, g, Date.now())
    setDone((n) => n + 1)
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Card {idx + 1} of {queue.length}
        </span>
        <span>Box {card.box + 1}/5</span>
      </div>
      <div className="mb-2 h-1.5 rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${(idx / queue.length) * 100}%` }}
        />
      </div>

      <button
        onClick={() => setRevealed(true)}
        className="mt-4 flex min-h-[16rem] w-full flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-sm transition hover:shadow-md"
      >
        <span className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">
          {revealed ? 'Answer' : 'Question'}
        </span>
        <div className="text-xl font-medium">
          <MathText text={revealed ? card.back : card.front} />
        </div>
        {!revealed && (
          <span className="mt-6 text-xs text-muted-foreground">
            Tap to reveal answer
          </span>
        )}
      </button>

      {revealed && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <button
            onClick={() => grade('again')}
            className="rounded-lg border border-destructive/30 bg-destructive/5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Again
          </button>
          <button
            onClick={() => grade('good')}
            className="rounded-lg border py-3 text-sm font-medium hover:bg-accent"
          >
            Good
          </button>
          <button
            onClick={() => grade('easy')}
            className="rounded-lg border border-emerald-300 bg-emerald-50 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Easy
          </button>
        </div>
      )}
    </div>
  )
}
