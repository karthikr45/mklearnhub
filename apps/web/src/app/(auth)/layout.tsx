import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* premium backdrop */}
      <div className="mk-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="mk-glow pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 opacity-40" />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="mk-brand-bg flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-violet-500/30">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">LearnHub</span>
        </Link>
        <div className="card-elevated p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by <span className="mk-brand-text font-semibold">MK Tech Monk</span>
        </p>
      </div>
    </div>
  )
}
