'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { TermsCheckbox } from '@/components/auth/TermsCheckbox'
import { useAuth } from '@/hooks/useAuth'

const ORG_TYPES = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'INSTITUTE', label: 'Institute / College' },
  { value: 'COACHING_CENTER', label: 'Coaching centre' },
  { value: 'BUSINESS', label: 'Business / Company' },
]

const schema = z.object({
  orgName: z.string().min(2, 'Required'),
  orgType: z.enum(['SCHOOL', 'INSTITUTE', 'COACHING_CENTER', 'BUSINESS']),
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

export default function OrganizationRegisterPage() {
  const { register: registerUser } = useAuth()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { orgType: 'SCHOOL' },
  })

  const onSubmit = (values: FormValues) =>
    registerUser.mutate(values, {
      onError: () => toast.error('Could not create your workspace'),
    })

  return (
    <div className="space-y-5">
      <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-lg font-semibold">Set up your organization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You’ll be the admin. Invite teachers and students afterwards.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Organization name</label>
          <input {...register('orgName')} placeholder="e.g. Sunrise Academy" className="w-full rounded-md border px-3 py-2 text-sm" />
          {errors.orgName && <p className="text-xs text-destructive">{errors.orgName.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select {...register('orgType')} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="border-t pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your login</p>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Your name</label>
              <input {...register('name')} className="w-full rounded-md border px-3 py-2 text-sm" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Work email</label>
              <input {...register('email')} type="email" className="w-full rounded-md border px-3 py-2 text-sm" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <input {...register('password')} type="password" className="w-full rounded-md border px-3 py-2 text-sm" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>
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
          {registerUser.isPending ? 'Creating…' : 'Create workspace'}
        </button>
      </form>
    </div>
  )
}
