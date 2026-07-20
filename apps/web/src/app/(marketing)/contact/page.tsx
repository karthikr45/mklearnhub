'use client'

import { CheckCircle2, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { useState } from 'react'

const TOPICS = ['Sales', 'Support', 'Partnership', 'Other'] as const

const CHANNELS = [
  { icon: Mail, label: 'Email', value: 'hello@learnhub.example' },
  { icon: Phone, label: 'Phone', value: '+91 80 4000 1234' },
  { icon: MapPin, label: 'Office', value: 'Bengaluru, India' },
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'Sales' as (typeof TOPICS)[number],
    message: '',
  })

  const valid =
    form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.message.trim().length > 5

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    // Marketing demo: no backend endpoint — acknowledge locally.
    setSent(true)
  }

  return (
    <section className="relative overflow-hidden">
      <div className="mk-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
            Contact
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Let’s <span className="mk-brand-text">talk</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Questions about plans, a demo, or partnerships? Send us a note and our
            team will get back within one business day.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <div className="rounded-3xl border bg-card p-8">
            {sent ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </span>
                <h2 className="text-xl font-semibold">Thanks, {form.name.split(' ')[0]}!</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  We’ve received your message about{' '}
                  <span className="font-medium">{form.topic}</span> and will reply
                  to <span className="font-medium">{form.email}</span> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false)
                    setForm({ name: '', email: '', topic: 'Sales', message: '' })
                  }}
                  className="mt-6 rounded-full border px-5 py-2 text-sm font-medium transition hover:bg-accent"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                      placeholder="Jane Doe"
                    />
                  </Field>
                  <Field label="Work email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                      placeholder="jane@company.com"
                    />
                  </Field>
                </div>

                <Field label="How can we help?">
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, topic: t })}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          form.topic === t
                            ? 'mk-brand-bg text-white'
                            : 'border text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Message">
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="w-full resize-none rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="Tell us a little about what you’re looking for…"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={!valid}
                  className="mk-brand-bg inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MessageSquare className="h-4 w-4" /> Send message
                </button>
              </form>
            )}
          </div>

          {/* Channels */}
          <div className="space-y-4">
            {CHANNELS.map((c) => (
              <div key={c.label} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-sm font-medium">{c.value}</div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
              Prefer to explore first?{' '}
              <a href="/register" className="font-medium text-violet-600 hover:underline">
                Create a free workspace
              </a>{' '}
              and try LearnHub right now.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
