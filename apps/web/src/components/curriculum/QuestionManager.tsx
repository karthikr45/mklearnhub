'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, HelpCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { MathText } from '@/components/study/MathText'
import { api } from '@/lib/api'

interface Option { id: string; text: string }
interface BankQuestion {
  id: string
  text: string
  type: string
  difficulty: string
  options: Option[]
  correctAnswer: unknown
  explanation?: string | null
}
interface Mapped {
  mappingId: string
  question: BankQuestion
}

const OPTION_IDS = ['A', 'B', 'C', 'D']
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']

/**
 * Admin practice-question authoring for a curriculum node. Lists questions
 * mapped to the node and lets an admin add MCQs (with a correct answer +
 * explanation) or delete them. These feed the student "Practice" flow.
 */
export function QuestionManager({
  nodeType,
  nodeId,
}: {
  nodeType: string
  nodeId: string
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  const { data } = useQuery({
    queryKey: ['node-questions', nodeType, nodeId],
    queryFn: async () =>
      (await api.get<Mapped[]>(`/curriculum/nodes/${nodeType}/${nodeId}/questions`)).data,
    enabled: open,
  })

  const remove = useMutation({
    mutationFn: async (mappingId: string) => {
      await api.delete(`/curriculum/question-mappings/${mappingId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['node-questions', nodeType, nodeId] })
      qc.invalidateQueries({ queryKey: ['practice-count', nodeType, nodeId] })
      toast.success('Question removed')
    },
    onError: () => toast.error('Could not remove question'),
  })

  const count = data?.length ?? 0

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Practice questions{open && data ? ` (${count})` : ''}
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-md border bg-muted/20 p-3">
          {count === 0 ? (
            <p className="text-xs text-muted-foreground">No questions yet.</p>
          ) : (
            <ul className="space-y-2">
              {data!.map((m, i) => (
                <li key={m.mappingId} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <div className="flex-1">
                    <MathText text={m.question.text} />
                    <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      ans: {String(m.question.correctAnswer)}
                    </span>
                  </div>
                  <button
                    onClick={() => remove.mutate(m.mappingId)}
                    disabled={remove.isPending}
                    aria-label="Delete question"
                    className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <AddQuestionForm
              nodeType={nodeType}
              nodeId={nodeId}
              onDone={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Add question
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AddQuestionForm({
  nodeType,
  nodeId,
  onDone,
}: {
  nodeType: string
  nodeId: string
  onDone: () => void
}) {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState('A')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState('MEDIUM')

  const create = useMutation({
    mutationFn: async () => {
      const opts = options
        .map((t, i) => ({ id: OPTION_IDS[i]!, text: t.trim() }))
        .filter((o) => o.text.length > 0)
      await api.post(`/curriculum/nodes/${nodeType}/${nodeId}/questions`, {
        text: text.trim(),
        type: 'MCQ',
        difficulty,
        options: opts,
        correctAnswer: correct,
        ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['node-questions', nodeType, nodeId] })
      qc.invalidateQueries({ queryKey: ['practice-count', nodeType, nodeId] })
      toast.success('Question added')
      onDone()
    },
    onError: () => toast.error('Could not add question (check the fields)'),
  })

  const validOptionCount = options.filter((o) => o.trim()).length
  const canSave =
    text.trim().length > 0 && validOptionCount >= 2 && options[OPTION_IDS.indexOf(correct)]?.trim()

  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Question (LaTeX with $…$ supported)"
        rows={2}
        className="w-full rounded-md border px-2 py-1.5 text-xs"
      />
      <div className="space-y-1.5">
        {OPTION_IDS.map((id, i) => (
          <div key={id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrect(id)}
              title="Mark correct"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                correct === id
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'text-muted-foreground'
              }`}
            >
              {correct === id ? <Check className="h-3 w-3" /> : id}
            </button>
            <input
              value={options[i]}
              onChange={(e) =>
                setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))
              }
              placeholder={`Option ${id}`}
              className="w-full rounded-md border px-2 py-1 text-xs"
            />
          </div>
        ))}
      </div>
      <input
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Explanation (optional)"
        className="w-full rounded-md border px-2 py-1.5 text-xs"
      />
      <div className="flex items-center justify-between gap-2">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-xs"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d[0] + d.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={onDone}
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!canSave || create.isPending}
            className="mk-brand-bg inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {create.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
