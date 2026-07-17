'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('Password updated')
      router.push('/login')
    } catch {
      toast.error('Invalid or expired token')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Set new password</h2>
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        Update password
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
