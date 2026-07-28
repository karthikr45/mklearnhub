'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Globe, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

interface IngestSummary {
  created: number
  published: number
  drafts: number
  skipped: { title: string; reason: string }[]
  coverage?: { book: string; published: number }[]
}

const CSV_TEMPLATE = `board,subject,chapter,title,url,type,source
CBSE,Science,Chemical Reactions and Equations,NCERT Ch1 — Chemical Reactions and Equations,https://ncert.nic.in/textbook/pdf/jesc101.pdf,PDF,NCERT
CBSE,Mathematics,Real Numbers,NCERT Ch1 — Real Numbers,https://ncert.nic.in/textbook/pdf/jemh101.pdf,PDF,NCERT`

/**
 * Admin automation for OFFICIAL external content (NCERT/CBSE/ePathshala/DIKSHA).
 * Everything here is LINKED, never self-hosted. Two flows:
 *  1) one-click: attach the verified official CBSE Grade 10 resource set;
 *  2) CSV bulk import for exact per-chapter official PDFs.
 * Unreachable links are saved as drafts (never shown to students) — the
 * ingest is self-correcting.
 */
export function OfficialResourcesPanel() {
  const qc = useQueryClient()
  const [csv, setCsv] = useState('')
  const [lastSummary, setLastSummary] = useState<IngestSummary | null>(null)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['learner-node-content'] })
    qc.invalidateQueries({ queryKey: ['node-coverage'] })
  }

  const oneClick = useMutation({
    // Verifies every NCERT chapter URL server-side — can take ~15–40s.
    mutationFn: async () =>
      (await api.post<IngestSummary>('/curriculum/official/cbse-grade10')).data,
    onSuccess: (s) => {
      setLastSummary(s)
      invalidate()
      toast.success(`${s.published} official links live (${s.drafts} unreachable, hidden)`)
    },
    onError: () => toast.error('Could not attach official resources'),
  })

  const importCsv = useMutation({
    mutationFn: async () =>
      (await api.post<IngestSummary>('/curriculum/official/import', { csv, verify: true })).data,
    onSuccess: (s) => {
      setLastSummary(s)
      setCsv('')
      invalidate()
      toast.success(`Imported ${s.created} resources (${s.published} live)`)
    },
    onError: () => toast.error('CSV import failed — check the columns'),
  })

  return (
    <div className="card-elevated space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Official resources (NCERT / CBSE)</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Auto-attach copyright-safe <strong>official</strong> resources to the curriculum —
        the NCERT/CBSE/ePathshala/DIKSHA portals <em>and every NCERT Class 10 chapter PDF</em>.
        These are linked, never re-hosted — students click through to the official source.
        Each chapter URL is verified on the server; unreachable ones are held as drafts and
        never shown to students.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => oneClick.mutate()}
          disabled={oneClick.isPending}
          className="mk-brand-bg inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {oneClick.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {oneClick.isPending
            ? 'Verifying NCERT chapters…'
            : 'Auto-add official CBSE Grade 10 (portals + all chapter PDFs)'}
        </button>
      </div>

      <div className="border-t pt-4">
        <p className="mb-1 text-sm font-medium">Bulk-import exact chapter PDFs (CSV)</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Columns: <code className="rounded bg-muted px-1">board, subject, chapter, title, url, type, source</code>
          (title + url required). Each URL is verified before it goes live. Re-importing is safe.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={CSV_TEMPLATE}
          rows={5}
          className="w-full rounded-md border px-3 py-2 font-mono text-xs"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => importCsv.mutate()}
            disabled={importCsv.isPending || csv.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            {importCsv.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import CSV
          </button>
          <button
            onClick={() => setCsv(CSV_TEMPLATE)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Load template
          </button>
        </div>
      </div>

      {lastSummary && (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="font-medium">
            {lastSummary.created} created · {lastSummary.published} live ·{' '}
            {lastSummary.drafts} pending (unreachable) · {lastSummary.skipped.length} skipped
          </p>
          {lastSummary.coverage && lastSummary.coverage.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">NCERT chapter PDFs found per book:</p>
              <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
                {lastSummary.coverage.map((c) => (
                  <li
                    key={c.book}
                    className={c.published === 0 ? 'text-destructive' : 'text-muted-foreground'}
                  >
                    {c.published === 0 ? '⚠ ' : '✓ '}
                    {c.book}: {c.published}
                    {c.published === 0 ? ' (none reachable — check book code/network)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lastSummary.skipped.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
              {lastSummary.skipped.slice(0, 8).map((s, i) => (
                <li key={i}>
                  {s.title}: {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
