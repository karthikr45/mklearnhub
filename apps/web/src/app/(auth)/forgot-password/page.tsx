'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Something went wrong')
    }
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        If an account exists for <strong>{email}</strong>, a reset link has been
        sent.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Reset password</h2>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        Send reset link
      </button>
    </form>
  )
}
