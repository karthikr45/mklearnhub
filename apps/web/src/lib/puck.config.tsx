import type { Config, Data } from '@measured/puck'

// ── Live data injected via Puck `metadata` (works in editor + renderer) ──
export interface PortalCourse {
  id: string
  title: string
  slug: string
  description?: string | null
  thumbnailUrl?: string | null
  level?: string
  enrollmentCount?: number
}
export interface PortalArticle {
  id: string
  title: string
  slug: string
  excerpt?: string | null
}
export interface PortalMetadata {
  courses: PortalCourse[]
  articles: PortalArticle[]
  [key: string]: unknown
}

function meta(puck: { metadata?: Record<string, unknown> }): PortalMetadata {
  const m = (puck.metadata ?? {}) as Partial<PortalMetadata>
  return { courses: m.courses ?? [], articles: m.articles ?? [] }
}

export const portalConfig: Config = {
  root: {
    render: ({ children }) => (
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-10">{children}</div>
    ),
  },
  components: {
    Hero: {
      label: 'Hero',
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'textarea' },
        buttonText: { type: 'text' },
        buttonUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Welcome to our portal',
        subtitle: 'Everything you need, in one place.',
        buttonText: 'Get started',
        buttonUrl: '#',
      },
      render: ({ title, subtitle, buttonText, buttonUrl }) => (
        <section className="rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mx-auto mt-3 max-w-2xl opacity-90">{subtitle}</p>
          {buttonText ? (
            <a
              href={buttonUrl || '#'}
              className="mt-6 inline-block rounded-md bg-background px-6 py-2.5 text-sm font-medium text-foreground"
            >
              {buttonText}
            </a>
          ) : null}
        </section>
      ),
    },

    RichText: {
      label: 'Text section',
      fields: {
        heading: { type: 'text' },
        body: { type: 'textarea' },
      },
      defaultProps: { heading: 'Section title', body: 'Write something here.' },
      // body is rendered as plain text (split into paragraphs) — never as raw
      // HTML — so a portal author cannot inject scripts.
      render: ({ heading, body }) => (
        <section className="py-10">
          {heading ? (
            <h2 className="mb-3 text-2xl font-semibold">{heading}</h2>
          ) : null}
          <div className="space-y-3 text-muted-foreground">
            {String(body ?? '')
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </section>
      ),
    },

    CTA: {
      label: 'Call to action',
      fields: {
        text: { type: 'text' },
        buttonText: { type: 'text' },
        buttonUrl: { type: 'text' },
      },
      defaultProps: {
        text: 'Ready to start learning?',
        buttonText: 'Browse courses',
        buttonUrl: '#',
      },
      render: ({ text, buttonText, buttonUrl }) => (
        <section className="my-10 flex flex-col items-center justify-between gap-4 rounded-xl border bg-card p-8 sm:flex-row">
          <p className="text-lg font-medium">{text}</p>
          <a
            href={buttonUrl || '#'}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {buttonText}
          </a>
        </section>
      ),
    },

    // ── Data-aware: pulls the org's published courses from metadata ──
    CourseCarousel: {
      label: 'Courses (live)',
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'Featured courses' },
      render: ({ title, puck }) => {
        const { courses } = meta(puck)
        return (
          <section className="py-10">
            <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No published courses yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => (
                  <div key={c.id} className="rounded-lg border bg-card p-5">
                    <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-muted text-2xl">
                      🎓
                    </div>
                    <h3 className="font-semibold">{c.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {c.description ?? ''}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.enrollmentCount ?? 0} enrolled
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      },
    },

    // ── Data-aware: pulls the org's published articles from metadata ──
    ArticleGrid: {
      label: 'Articles (live)',
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'From our knowledge base' },
      render: ({ title, puck }) => {
        const { articles } = meta(puck)
        return (
          <section className="py-10">
            <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No published articles yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {articles.map((a) => (
                  <div key={a.id} className="rounded-lg border bg-card p-5">
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {a.excerpt ?? ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      },
    },
  },
}

export const emptyPortalData: Data = { content: [], root: {} }
