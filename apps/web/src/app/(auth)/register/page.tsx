'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
  orgName: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface InviteInfo {
  valid: boolean
  email?: string
  role?: string
  organizationName?: string
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const { register: registerUser } = useAuth()

  const { data: invite, isLoading: inviteLoading } = useQuery({
    queryKey: ['invite', inviteToken],
    queryFn: async () => {
      const { data } = await axios.get<InviteInfo>(
        `${api.defaults.baseURL}/invites/${inviteToken}`,
      )
      return data
    },
    enabled: Boolean(inviteToken),
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const hasValidInvite = Boolean(inviteToken) && invite?.valid === true

  useEffect(() => {
    if (hasValidInvite && invite?.email) {
      setValue('email', invite.email)
    }
  }, [hasValidInvite, invite?.email, setValue])

  const onSubmit = (values: FormValues) => {
    registerUser.mutate(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        ...(values.orgName && !hasValidInvite ? { orgName: values.orgName } : {}),
        ...(hasValidInvite && inviteToken ? { inviteToken } : {}),
      },
      {
        onError: () => toast.error('Could not create account'),
      },
    )
  }

  const inviteInvalid = Boolean(inviteToken) && !inviteLoading && !hasValidInvite

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Create account</h2>

      {hasValidInvite && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          You&apos;ve been invited to join{' '}
          <span className="font-medium">
            {invite?.organizationName ?? 'the organization'}
          </span>
          {invite?.role ? (
            <>
              {' '}
              as <span className="font-medium">{invite.role}</span>
            </>
          ) : null}
          .
        </div>
      )}

      {inviteInvalid && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          This invite link is invalid or has expired. You can still create a
          regular account below.
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium capitalize">name</label>
        <input
          {...register('name')}
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium capitalize">email</label>
        <input
          {...register('email')}
          type="email"
          readOnly={hasValidInvite}
          className="w-full rounded-md border px-3 py-2 text-sm read-only:bg-muted"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium capitalize">password</label>
        <input
          {...register('password')}
          type="password"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {!hasValidInvite && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Organization (optional)</label>
          <input
            {...register('orgName')}
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {errors.orgName && (
            <p className="text-xs text-destructive">{errors.orgName.message}</p>
          )}
        </div>
      )}

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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
