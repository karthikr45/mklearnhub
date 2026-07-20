import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

import { BRAND } from './nav'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="mk-brand-bg inline-flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm shadow-violet-500/30 transition-transform group-hover:scale-105">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
    </Link>
  )
}
