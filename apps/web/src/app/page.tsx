import { BookOpen, GraduationCap, School } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">LearnHub</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Knowledge base, LMS, and school management — one platform for
          organizations, institutes, and students.
        </p>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-3">
        {[
          { icon: BookOpen, title: 'Knowledge Base', desc: 'Spaces, manuals & articles' },
          { icon: GraduationCap, title: 'Courses & LMS', desc: 'Video, quizzes & certificates' },
          { icon: School, title: 'School Suite', desc: 'Batches, attendance & grades' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border p-6 text-left">
            <Icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Create account
        </Link>
      </div>
    </main>
  )
}
