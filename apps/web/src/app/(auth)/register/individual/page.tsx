'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { TermsCheckbox } from '@/components/auth/TermsCheckbox'
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
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms and Privacy Policy' }),
  }),
})
type FormValues = z.infer<typeof schema>

export default function IndividualRegisterPage() {
  const { register: registerUser } = useAuth()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) =>
    registerUser.mutate(values, {
      onError: () => toast.error('Could not create account'),
    })

  return (
    <div className="space-y-5">
      <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-lg font-semibold">Create your learner account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start exploring courses in under a minute.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Full name</label>
          <input {...register('name')} className="w-full rounded-md border px-3 py-2 text-sm" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input {...register('email')} type="email" className="w-full rounded-md border px-3 py-2 text-sm" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input {...register('password')} type="password" className="w-full rounded-md border px-3 py-2 text-sm" />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <TermsCheckbox
          checked={watch('termsAccepted') === true}
          onChange={(v) =>
            setValue('termsAccepted', v as true, { shouldValidate: true })
          }
          {...(errors.termsAccepted?.message
            ? { error: errors.termsAccepted.message }
            : {})}
        />
        <button
          type="submit"
          disabled={registerUser.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {registerUser.isPending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
