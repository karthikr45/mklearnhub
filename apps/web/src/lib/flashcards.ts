import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Flashcard {
  id: string
  front: string
  back: string
  box: number // Leitner box 0–4
  due: number // epoch ms when next due
  reviews: number
}

export interface Deck {
  id: string
  name: string
  subject: string
  cards: Flashcard[]
  createdAt: number
}

// Leitner intervals per box, in days. Box 0 = due immediately.
const INTERVALS_DAYS = [0, 1, 3, 7, 16]
const DAY_MS = 24 * 60 * 60 * 1000

function uid(): string {
  // crypto.randomUUID is available in modern browsers; fall back for older ones.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

export function dueCards(deck: Deck, now: number): Flashcard[] {
  return deck.cards.filter((c) => c.due <= now)
}

export function nextDue(box: number, now: number): number {
  const days = INTERVALS_DAYS[Math.min(box, INTERVALS_DAYS.length - 1)] ?? 0
  return now + days * DAY_MS
}

interface FlashcardState {
  decks: Deck[]
  createDeck: (name: string, subject: string) => string
  renameDeck: (deckId: string, name: string, subject: string) => void
  deleteDeck: (deckId: string) => void
  addCard: (deckId: string, front: string, back: string) => void
  updateCard: (deckId: string, cardId: string, front: string, back: string) => void
  deleteCard: (deckId: string, cardId: string) => void
  gradeCard: (deckId: string, cardId: string, grade: 'again' | 'good' | 'easy', now: number) => void
  seedStarter: () => void
}

const STARTER: { name: string; subject: string; cards: [string, string][] }[] = [
  {
    name: 'Physics — Kinematics',
    subject: 'Physics',
    cards: [
      ['State the three equations of motion.', '$v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 = u^2 + 2as$'],
      ['Define acceleration.', 'The rate of change of velocity with time: $a = \\frac{dv}{dt}$.'],
      ['What is the SI unit of force?', 'Newton (N) = $kg\\cdot m/s^2$.'],
    ],
  },
  {
    name: 'Chemistry — Periodic Table',
    subject: 'Chemistry',
    cards: [
      ['What is the atomic number of Carbon?', '6'],
      ['Name the most electronegative element.', 'Fluorine (F).'],
      ['What are the noble gases known for?', 'A full valence shell, making them largely inert.'],
    ],
  },
]

export const useFlashcards = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: [],
      createDeck: (name, subject) => {
        const id = uid()
        set((s) => ({
          decks: [
            ...s.decks,
            { id, name, subject, cards: [], createdAt: Date.now() },
          ],
        }))
        return id
      },
      renameDeck: (deckId, name, subject) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId ? { ...d, name, subject } : d,
          ),
        })),
      deleteDeck: (deckId) =>
        set((s) => ({ decks: s.decks.filter((d) => d.id !== deckId) })),
      addCard: (deckId, front, back) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: [
                    ...d.cards,
                    { id: uid(), front, back, box: 0, due: 0, reviews: 0 },
                  ],
                }
              : d,
          ),
        })),
      updateCard: (deckId, cardId, front, back) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: d.cards.map((c) =>
                    c.id === cardId ? { ...c, front, back } : c,
                  ),
                }
              : d,
          ),
        })),
      deleteCard: (deckId, cardId) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) }
              : d,
          ),
        })),
      gradeCard: (deckId, cardId, grade, now) =>
        set((s) => ({
          decks: s.decks.map((d) => {
            if (d.id !== deckId) return d
            return {
              ...d,
              cards: d.cards.map((c) => {
                if (c.id !== cardId) return c
                const box =
                  grade === 'again'
                    ? 0
                    : grade === 'easy'
                      ? Math.min(c.box + 2, 4)
                      : Math.min(c.box + 1, 4)
                return { ...c, box, due: nextDue(box, now), reviews: c.reviews + 1 }
              }),
            }
          }),
        })),
      seedStarter: () => {
        if (get().decks.length > 0) return
        set({
          decks: STARTER.map((d) => ({
            id: uid(),
            name: d.name,
            subject: d.subject,
            createdAt: Date.now(),
            cards: d.cards.map(([front, back]) => ({
              id: uid(),
              front,
              back,
              box: 0,
              due: 0,
              reviews: 0,
            })),
          })),
        })
      },
    }),
    { name: 'learnhub-flashcards' },
  ),
)
