'use client'

import { Layers, Plus, Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { dueCards, useFlashcards } from '@/lib/flashcards'

export default function FlashcardsPage() {
  const decks = useFlashcards((s) => s.decks)
  const createDeck = useFlashcards((s) => s.createDeck)
  const deleteDeck = useFlashcards((s) => s.deleteDeck)
  const seedStarter = useFlashcards((s) => s.seedStarter)
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')

  useEffect(() => setMounted(true), [])

  const now = Date.now()

  return (
    <div>
      <PageHeader
        title="Flashcards"
        description="Build decks and review with spaced repetition — cards you find hard come back sooner."
      />

      <div className="mb-8 card-elevated p-5">
        <h2 className="mb-3 text-sm font-semibold">Create a deck</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createDeck(name.trim(), subject.trim() || 'General')
            setName('')
            setSubject('')
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Deck name (e.g. Biology — Cell)"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-40 rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="mk-brand-bg inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Create
          </button>
        </form>
      </div>

      {!mounted ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : decks.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No decks yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first deck above, or start with a few sample decks.
          </p>
          <button
            onClick={seedStarter}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Sparkles className="h-4 w-4 text-primary" /> Add sample decks
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const due = dueCards(deck, now).length
            const mastered = deck.cards.filter((c) => c.box >= 4).length
            return (
              <div key={deck.id} className="group card-elevated card-elevated-hover flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {deck.subject}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete deck "${deck.name}"?`)) deleteDeck(deck.id)
                    }}
                    className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                    aria-label="Delete deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Link href={`/dashboard/flashcards/${deck.id}`} className="mt-2 flex-1">
                  <h3 className="font-semibold leading-snug">{deck.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {deck.cards.length} card{deck.cards.length === 1 ? '' : 's'} ·{' '}
                    {mastered} mastered
                  </p>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      due > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {due > 0 ? `${due} due` : 'All caught up'}
                  </span>
                  <Link
                    href={`/dashboard/flashcards/${deck.id}?study=1`}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    Study
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
