'use client'

import { useQuery } from '@tanstack/react-query'
import { Swords, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { MathText } from '@/components/study/MathText'
import { getStudySocket } from '@/lib/studySocket'
import { useAuthStore } from '@/lib/store'

interface Option {
  id: string
  text: string
}
interface LiveQuestion {
  index: number
  total: number
  question: { id: string; text: string; options: Option[] }
  durationMs: number
}
interface LeaderRow {
  userId: string
  name: string
  score: number
  correct: number
}
interface Lobby {
  battleId: string
  title: string
  hostId: string
  questionCount: number
  participants: { userId: string; name: string }[]
}
interface Assessment {
  id: string
  title: string
  questionCount: number
}

type Phase = 'idle' | 'lobby' | 'question' | 'reveal' | 'final'

export function LiveBattle({ groupId }: { groupId: string }) {
  const me = useAuthStore((s) => s.user?.id)
  const [phase, setPhase] = useState<Phase>('idle')
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [battleId, setBattleId] = useState<string | null>(null)
  const [question, setQuestion] = useState<LiveQuestion | null>(null)
  const [answered, setAnswered] = useState<string | null>(null)
  const [reveal, setReveal] = useState<{ correct: string; board: LeaderRow[] } | null>(null)
  const [board, setBoard] = useState<LeaderRow[]>([])
  const [announce, setAnnounce] = useState<{ battleId: string; title: string; hostName: string } | null>(null)
  const battleIdRef = useRef<string | null>(null)

  const { data: assessments } = useQuery({
    queryKey: ['study-assessments'],
    queryFn: async () => (await api.get<Assessment[]>('/study/assessments')).data,
  })

  useEffect(() => {
    const socket = getStudySocket()
    socket.emit('group:join', { groupId })

    const onCreated = (d: { battleId: string }) => {
      setBattleId(d.battleId)
      battleIdRef.current = d.battleId
    }
    const onAnnounced = (d: { battleId: string; title: string; hostName: string }) => {
      if (d.battleId !== battleIdRef.current) setAnnounce(d)
    }
    const onLobby = (d: Lobby) => {
      setLobby(d)
      setBattleId(d.battleId)
      battleIdRef.current = d.battleId
      setPhase('lobby')
    }
    const onQuestion = (q: LiveQuestion) => {
      setQuestion(q)
      setAnswered(null)
      setReveal(null)
      setPhase('question')
    }
    const onReveal = (d: { correctAnswer: string; leaderboard: LeaderRow[] }) => {
      setReveal({ correct: d.correctAnswer, board: d.leaderboard })
      setBoard(d.leaderboard)
      setPhase('reveal')
    }
    const onFinal = (d: { leaderboard: LeaderRow[] }) => {
      setBoard(d.leaderboard)
      setPhase('final')
    }
    const onErr = (d: { message: string }) => toast.error(d.message)

    socket.on('battle:created', onCreated)
    socket.on('battle:announced', onAnnounced)
    socket.on('battle:lobby', onLobby)
    socket.on('battle:question', onQuestion)
    socket.on('battle:reveal', onReveal)
    socket.on('battle:final', onFinal)
    socket.on('error:battle', onErr)
    return () => {
      socket.off('battle:created', onCreated)
      socket.off('battle:announced', onAnnounced)
      socket.off('battle:lobby', onLobby)
      socket.off('battle:question', onQuestion)
      socket.off('battle:reveal', onReveal)
      socket.off('battle:final', onFinal)
      socket.off('error:battle', onErr)
    }
  }, [groupId])

  const createBattle = (assessmentId: string) => {
    getStudySocket().emit('battle:create', { groupId, assessmentId })
  }
  const joinAnnounced = () => {
    if (announce) {
      getStudySocket().emit('battle:join', { battleId: announce.battleId })
      setAnnounce(null)
    }
  }
  const startBattle = () => {
    if (battleId) getStudySocket().emit('battle:start', { battleId })
  }
  const answer = (optId: string) => {
    if (answered || !battleId) return
    setAnswered(optId)
    getStudySocket().emit('battle:answer', { battleId, answer: optId })
  }

  const isHost = lobby?.hostId === me

  // ── Idle: pick a test to battle, or a prompt to join ──
  if (phase === 'idle') {
    return (
      <div>
        {announce && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3">
            <span className="text-sm">
              <span className="font-medium">{announce.hostName}</span> started{' '}
              <span className="font-medium">{announce.title}</span>
            </span>
            <button
              onClick={joinAnnounced}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Join battle
            </button>
          </div>
        )}
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Swords className="mx-auto mb-2 h-8 w-8 text-primary" />
          <p className="font-medium">Start a live quiz battle</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Challenge your group in real time — fastest correct answers win.
          </p>
          <div className="mx-auto grid max-w-sm gap-2">
            {assessments?.map((a) => (
              <button
                key={a.id}
                onClick={() => createBattle(a.id)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                {a.title}{' '}
                <span className="text-xs text-muted-foreground">
                  ({a.questionCount} Q)
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'lobby' && lobby) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <Swords className="mx-auto mb-2 h-8 w-8 text-primary" />
        <h3 className="font-semibold">{lobby.title}</h3>
        <p className="text-sm text-muted-foreground">
          {lobby.questionCount} questions · waiting to start
        </p>
        <div className="my-4 flex flex-wrap justify-center gap-2">
          {lobby.participants.map((p) => (
            <span key={p.userId} className="rounded-full bg-secondary px-3 py-1 text-sm">
              {p.name}
            </span>
          ))}
        </div>
        {isHost ? (
          <button
            onClick={startBattle}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Start battle
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for the host to start…</p>
        )}
      </div>
    )
  }

  if (phase === 'question' && question) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="mb-1 text-xs text-muted-foreground">
          Question {question.index + 1} of {question.total}
        </p>
        <p className="text-lg font-medium"><MathText text={question.question.text} /></p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.question.options.map((o) => (
            <button
              key={o.id}
              onClick={() => answer(o.id)}
              disabled={Boolean(answered)}
              className={`rounded-lg border p-3 text-left text-sm transition disabled:opacity-70 ${
                answered === o.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:bg-accent'
              }`}
            >
              <span className="font-semibold uppercase">{o.id}.</span> <MathText text={o.text} />
            </button>
          ))}
        </div>
        {answered && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Answer locked in — waiting for others…
          </p>
        )}
      </div>
    )
  }

  if (phase === 'reveal' && reveal) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-sm">
          Correct answer: <span className="font-semibold uppercase">{reveal.correct}</span>
        </p>
        <Leaderboard rows={reveal.board} me={me} />
        <p className="mt-2 text-center text-xs text-muted-foreground">Next question…</p>
      </div>
    )
  }

  if (phase === 'final') {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <Trophy className="mx-auto mb-2 h-9 w-9 text-amber-500" />
        <h3 className="font-semibold">Battle complete!</h3>
        <Leaderboard rows={board} me={me} />
        <button
          onClick={() => {
            setPhase('idle')
            setLobby(null)
            setBattleId(null)
            battleIdRef.current = null
          }}
          className="mt-4 rounded-md border px-4 py-2 text-sm"
        >
          Back
        </button>
      </div>
    )
  }

  return null
}

function Leaderboard({ rows, me }: { rows: LeaderRow[]; me?: string | undefined }) {
  return (
    <div className="mx-auto mt-4 max-w-sm space-y-1.5">
      {rows.map((r, i) => (
        <div
          key={r.userId}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
            r.userId === me ? 'border-primary bg-primary/5' : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-5 font-semibold text-muted-foreground">#{i + 1}</span>
            {r.name}
          </span>
          <span className="font-semibold">{r.score}</span>
        </div>
      ))}
    </div>
  )
}
