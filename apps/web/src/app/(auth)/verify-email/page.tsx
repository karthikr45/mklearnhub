'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { api } from '@/lib/api'

function VerifyInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="space-y-4 text-center">
      {status === 'pending' && <p className="text-sm">Verifying…</p>}
      {status === 'ok' && (
        <p className="text-sm text-green-600">Email verified! You can sign in.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-destructive">
          Verification link is invalid or expired.
        </p>
      )}
      <Link href="/login" className="text-sm text-primary hover:underline">
        Go to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  )
}
