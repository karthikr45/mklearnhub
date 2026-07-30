'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

interface BoardYear { id: string; label: string; isCurrent: boolean }
interface Board { id: string; code: string; name: string; years: BoardYear[] }

/**
 * Admin: build a curriculum from scratch — Board → Academic Year → Grade.
 * Uses the generic node-create API. Subjects/chapters/topics are then added
 * from the tree below (or via CSV import).
 */
export function CreateCurriculumPanel() {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)

  // board
  const [boardName, setBoardName] = useState('')
  const [boardCode, setBoardCode] = useState('')
  // year
  const [yearBoard, setYearBoard] = useState('')
  const [yearLabel, setYearLabel] = useState('')
  // grade
  const [gradeBoard, setGradeBoard] = useState('')
  const [gradeYear, setGradeYear] = useState('')
  const [gradeName, setGradeName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')

  const { data: boards } = useQuery({
    queryKey: ['curriculum-boards-admin'],
    queryFn: async () => (await api.get<Board[]>('/curriculum/boards')).data,
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['curriculum-boards-admin'] })
    void qc.invalidateQueries({ queryKey: ['curriculum-tree'] })
  }

  const createBoard = async () => {
    if (!boardName.trim()) return
    setBusy(true)
    try {
      await api.post('/curriculum/nodes/board', {
        title: boardName.trim(),
        ...(boardCode.trim() ? { code: boardCode.trim().toUpperCase() } : {}),
      })
      setBoardName('')
      setBoardCode('')
      refresh()
      toast.success('Board created')
    } catch {
      toast.error('Could not create board')
    } finally {
      setBusy(false)
    }
  }

  const createYear = async () => {
    if (!yearBoard || !yearLabel.trim()) return
    setBusy(true)
    try {
      await api.post('/curriculum/nodes/year', {
        parentId: yearBoard,
        title: yearLabel.trim(),
        isCurrent: true,
      })
      setYearLabel('')
      refresh()
      toast.success('Academic year created')
    } catch {
      toast.error('Could not create year')
    } finally {
      setBusy(false)
    }
  }

  const createGrade = async () => {
    if (!gradeYear || !gradeName.trim()) return
    setBusy(true)
    try {
      await api.post('/curriculum/nodes/grade', {
        parentId: gradeYear,
        title: gradeName.trim(),
        ...(gradeLevel.trim() ? { level: Number(gradeLevel) } : {}),
      })
      setGradeName('')
      setGradeLevel('')
      refresh()
      toast.success('Grade created — add subjects in the tree below')
    } catch {
      toast.error('Could not create grade')
    } finally {
      setBusy(false)
    }
  }

  const gradeYears = boards?.find((b) => b.id === gradeBoard)?.years ?? []

  return (
    <div className="card-elevated space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Create curriculum</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Build a new curriculum top-down: <strong>Board → Academic Year → Grade</strong>.
        Then add subjects, chapters and topics in the tree below (or import a CSV).
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Board */}
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 · Board</p>
          <input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Name (e.g. CBSE)"
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          />
          <input
            value={boardCode}
            onChange={(e) => setBoardCode(e.target.value)}
            placeholder="Code (optional, e.g. CBSE)"
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          />
          <button
            onClick={createBoard}
            disabled={busy || !boardName.trim()}
            className="inline-flex w-full items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add board
          </button>
        </div>

        {/* 2. Academic Year */}
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2 · Academic Year</p>
          <select
            value={yearBoard}
            onChange={(e) => setYearBoard(e.target.value)}
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm"
          >
            <option value="">Select board…</option>
            {boards?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input
            value={yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
            placeholder="Label (e.g. 2026-27)"
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          />
          <button
            onClick={createYear}
            disabled={busy || !yearBoard || !yearLabel.trim()}
            className="inline-flex w-full items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add year
          </button>
        </div>

        {/* 3. Grade */}
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3 · Grade / Class</p>
          <select
            value={gradeBoard}
            onChange={(e) => { setGradeBoard(e.target.value); setGradeYear('') }}
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm"
          >
            <option value="">Select board…</option>
            {boards?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={gradeYear}
            onChange={(e) => setGradeYear(e.target.value)}
            disabled={!gradeBoard}
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="">Select year…</option>
            {gradeYears.map((y) => (
              <option key={y.id} value={y.id}>{y.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              placeholder="Name (e.g. Grade 10)"
              className="w-full rounded-md border px-2.5 py-1.5 text-sm"
            />
            <input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="Class no."
              inputMode="numeric"
              className="w-24 rounded-md border px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={createGrade}
            disabled={busy || !gradeYear || !gradeName.trim()}
            className="mk-brand-bg inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add grade
          </button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        The <strong>Class no.</strong> (e.g. 10) is what links a student who picks “Class 10” to this grade.
      </p>
    </div>
  )
}
