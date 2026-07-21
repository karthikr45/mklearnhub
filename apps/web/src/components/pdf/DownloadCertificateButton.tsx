'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { CertificateData } from '@/lib/pdf/certificate'

export function DownloadCertificateButton({
  data,
  className,
  label = 'PDF',
}: {
  data: CertificateData
  className?: string
  label?: string
}) {
  const [busy, setBusy] = useState(false)

  const download = async () => {
    setBusy(true)
    try {
      // Lazy-load @react-pdf/renderer only when a cert is actually downloaded.
      const [{ generateCertificateBlob }, { downloadBlob }] = await Promise.all([
        import('@/lib/pdf/certificate'),
        import('@/lib/pdf/download'),
      ])
      const blob = await generateCertificateBlob(data)
      downloadBlob(blob, `certificate-${data.certificateNo}.pdf`)
    } catch {
      toast.error('Could not generate the certificate. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className={
        className ??
        'inline-flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50'
      }
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  )
}
