'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[0-9]/, 'Needs a number'),
  orgName: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    registerUser.mutate(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        ...(values.orgName ? { orgName: values.orgName } : {}),
      },
      {
        onError: () => toast.error('Could not create account'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Create account</h2>
      {(['name', 'email', 'password', 'orgName'] as const).map((field) => (
        <div key={field} className="space-y-1">
          <label className="text-sm font-medium capitalize">
            {field === 'orgName' ? 'Organization (optional)' : field}
          </label>
          <input
            {...register(field)}
            type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {errors[field] && (
            <p className="text-xs text-destructive">{errors[field]?.message}</p>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={registerUser.isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {registerUser.isPending ? 'Creating…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
