'use client'

import * as React from 'react'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  XCircle,
} from 'lucide-react'

import { cn } from '../../lib/utils'

export type BulkImportType = 'USERS' | 'ENROLLMENTS' | 'GRADES' | 'ATTENDANCE'

export interface BulkImportResult {
  success: number
  failed: number
}

export interface BulkImportProps {
  importType: BulkImportType
  templateColumns: string[]
  onComplete?: (result: BulkImportResult) => void
}

type ImportState =
  | 'idle'
  | 'dragging'
  | 'validating'
  | 'preview'
  | 'importing'
  | 'done'
  | 'error'

interface ParsedRow {
  cells: string[]
  valid: boolean
}

const PREVIEW_LIMIT = 5

function parseCsv(text: string, columns: string[]): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Drop the header row if it matches the template columns.
  const [firstLine, ...rest] = lines
  const headerCells = firstLine ? firstLine.split(',').map((c) => c.trim()) : []
  const isHeader =
    headerCells.length === columns.length &&
    headerCells.every(
      (cell, index) =>
        cell.toLowerCase() === (columns[index] ?? '').toLowerCase(),
    )
  const dataLines = isHeader ? rest : lines

  return dataLines.map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    // Treat every template column as required for the demo.
    const valid = columns.every((_, index) => {
      const value = cells[index]
      return value !== undefined && value.length > 0
    })
    return { cells, valid }
  })
}

function BulkImport({
  importType,
  templateColumns,
  onComplete,
}: BulkImportProps): React.JSX.Element {
  const [state, setState] = React.useState<ImportState>('idle')
  const [fileName, setFileName] = React.useState<string>('')
  const [rows, setRows] = React.useState<ParsedRow[]>([])
  const [progress, setProgress] = React.useState<number>(0)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [])

  const validRows = rows.filter((r) => r.valid).length
  const invalidRows = rows.length - validRows

  const handleFile = React.useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setState('error')
        setErrorMessage('Please upload a .csv file.')
        return
      }
      setFileName(file.name)
      setState('validating')
      const reader = new FileReader()
      reader.onload = () => {
        const text =
          typeof reader.result === 'string' ? reader.result : ''
        const parsed = parseCsv(text, templateColumns)
        if (parsed.length === 0) {
          setState('error')
          setErrorMessage('The file appears to be empty.')
          return
        }
        setRows(parsed)
        setState('preview')
      }
      reader.onerror = () => {
        setState('error')
        setErrorMessage('Could not read the file.')
      }
      reader.readAsText(file)
    },
    [templateColumns],
  )

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) handleFile(file)
      else setState('idle')
    },
    [handleFile],
  )

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setState((prev) => (prev === 'idle' ? 'dragging' : prev))
    },
    [],
  )

  const handleDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setState((prev) => (prev === 'dragging' ? 'idle' : prev))
    },
    [],
  )

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleBrowse = React.useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleDownloadTemplate = React.useCallback(() => {
    if (typeof document === 'undefined') return
    const csv = `${templateColumns.join(',')}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${importType.toLowerCase()}-template.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [importType, templateColumns])

  const handleReset = React.useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState('idle')
    setFileName('')
    setRows([])
    setProgress(0)
    setErrorMessage('')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleImport = React.useCallback(() => {
    setState('importing')
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10
        if (next >= 100) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setState('done')
          onComplete?.({ success: validRows, failed: invalidRows })
          return 100
        }
        return next
      })
    }, 200)
  }, [invalidRows, onComplete, validRows])

  const previewRows = rows.slice(0, PREVIEW_LIMIT)
  const isDropActive = state === 'idle' || state === 'dragging'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Import <span className="font-medium text-foreground">{importType}</span>{' '}
          from a CSV file.
        </p>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Download template
        </button>
      </div>

      {isDropActive ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleBrowse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleBrowse()
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
            state === 'dragging'
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drag &amp; drop a CSV here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Columns: {templateColumns.join(', ')}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : null}

      {state === 'validating' ? (
        <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Validating {fileName}…
        </div>
      ) : null}

      {state === 'error' ? (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" /> {errorMessage}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state === 'preview' || state === 'importing' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              {fileName}
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> {validRows} valid
            </span>
            {invalidRows > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <XCircle className="h-4 w-4" /> {invalidRows} invalid
              </span>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Status</th>
                  {templateColumns.map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    {templateColumns.map((col, colIndex) => (
                      <td
                        key={col}
                        className="px-3 py-2 text-muted-foreground"
                      >
                        {row.cells[colIndex] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > PREVIEW_LIMIT ? (
            <p className="text-xs text-muted-foreground">
              Showing first {PREVIEW_LIMIT} of {rows.length} rows.
            </p>
          ) : null}

          {state === 'importing' ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Importing… {progress}%
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={validRows === 0}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" /> Import {validRows} rows
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : null}

      {state === 'done' ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Imported {validRows} rows
            {invalidRows > 0 ? `, skipped ${invalidRows}` : ''}.
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Import another file
          </button>
        </div>
      ) : null}
    </div>
  )
}

export { BulkImport }
