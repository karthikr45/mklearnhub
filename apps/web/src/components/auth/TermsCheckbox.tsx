'use client'

import Link from 'next/link'

/** Reusable Terms & Privacy acceptance checkbox for registration forms. */
export function TermsCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
}) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-[hsl(243_75%_59%)]"
        />
        <span className="text-muted-foreground">
          I agree to the{' '}
          <Link
            href="/terms"
            target="_blank"
            className="font-medium text-primary hover:underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="font-medium text-primary hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

/** Parental/guardian consent checkbox — required for student (minor) signup. */
export function ParentalConsentCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
}) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-[hsl(243_75%_59%)]"
        />
        <span className="text-muted-foreground">
          I confirm that a parent or guardian has reviewed and consented to my
          registration and use of LearnHub, as required for students under 18
          (Digital Personal Data Protection Act, 2023).
        </span>
      </label>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
