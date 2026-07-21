'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowRight, Building2, GraduationCap, User } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { TermsCheckbox } from '@/components/auth/TermsCheckbox'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

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

interface InviteInfo {
  valid: boolean
  email?: string
  role?: string
  organizationName?: string
}

const CHOICES = [
  {
    href: '/register/student',
    icon: GraduationCap,
    title: 'I’m a student joining my school',
    desc: 'Join with the class code your teacher gave you.',
  },
  {
    href: '/register/organization',
    icon: Building2,
    title: 'I’m setting up my school or organization',
    desc: 'Create a workspace for your school, institute or team.',
  },
  {
    href: '/register/individual',
    icon: User,
    title: 'Just me — self-study learner',
    desc: 'Practice for CBSE / Intermediate / JEE / NEET and take public courses.',
  },
]

/** Invite acceptance: role, org and email are pre-decided — only name + password. */
function InviteForm({ token }: { token: string }) {
  const { register: registerUser } = useAuth()
  const { data: invite, isLoading } = useQuery({
    queryKey: ['invite', token],
    queryFn: async () => {
      const { data } = await axios.get<InviteInfo>(
        `${api.defaults.baseURL}/invites/${token}`,
      )
      return data
    },
  })
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const valid = invite?.valid === true
  useEffect(() => {
    if (valid && invite?.email) setValue('email', invite.email)
  }, [valid, invite?.email, setValue])

  const onSubmit = (values: FormValues) =>
    registerUser.mutate(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        inviteToken: token,
        termsAccepted: values.termsAccepted,
      },
      { onError: () => toast.error('Could not create account') },
    )

  if (isLoading) {
    return <p className="text-center text-sm text-muted-foreground">Loading…</p>
  }
  if (!valid) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          This invite link is invalid or has expired.
        </p>
        <Link href="/register" className="text-sm text-primary hover:underline">
          See sign-up options
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Create your account</h2>
      <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        You’ve been invited to join{' '}
        <span className="font-medium">{invite?.organizationName ?? 'the organization'}</span>
        {invite?.role ? (
          <>
            {' '}as <span className="font-medium">{invite.role.toLowerCase()}</span>
          </>
        ) : null}
        .
      </div>
      <Field label="Full name" error={errors.name?.message}>
        <input {...register('name')} className="w-full rounded-md border px-3 py-2 text-sm" />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input {...register('email')} type="email" readOnly className="w-full rounded-md border px-3 py-2 text-sm read-only:bg-muted" />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input {...register('password')} type="password" className="w-full rounded-md border px-3 py-2 text-sm" />
      </Field>
      <TermsCheckbox
        checked={watch('termsAccepted') === true}
        onChange={(v) =>
          setValue('termsAccepted', v as true, { shouldValidate: true })
        }
        {...(errors.termsAccepted?.message
          ? { error: errors.termsAccepted.message }
          : {})}
      />
      <SubmitButton pending={registerUser.isPending} label="Create account" />
    </form>
  )
}

function Chooser() {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold">How would you like to start?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick what fits you best.</p>
      </div>
      <div className="space-y-3">
        {CHOICES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-3 rounded-lg border p-4 transition hover:border-primary/50 hover:bg-accent"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <c.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{c.title}</span>
              <span className="block text-xs text-muted-foreground">{c.desc}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function RegisterInner() {
  const token = useSearchParams().get('invite')
  return token ? <InviteForm token={token} /> : <Chooser />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
      <RegisterInner />
    </Suspense>
  )
}

// Small shared UI helpers (also used by the sibling register pages via classes).
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Creating…' : label}
    </button>
  )
}
