'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    login.mutate(values, {
      onError: () => toast.error('Invalid email or password'),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Sign in</h2>
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          {...register('email')}
          type="email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="admin@acmecorp.com"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <input
          {...register('password')}
          type="password"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={login.isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}
