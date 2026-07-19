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
    FAQ: {
      label: 'FAQ',
      fields: {
        title: { type: 'text' },
        items: {
          type: 'array',
          arrayFields: {
            question: { type: 'text' },
            answer: { type: 'textarea' },
          },
          defaultItemProps: { question: 'Question?', answer: 'Answer.' },
        },
      },
      defaultProps: {
        title: 'Frequently asked questions',
        items: [
          { question: 'How do I get started?', answer: 'Sign in and explore.' },
        ],
      },
      render: ({ title, items }) => {
        const list = Array.isArray(items) ? items : []
        return (
          <section className="py-10">
            <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
            <div className="space-y-3">
              {list.map(
                (it: { question?: string; answer?: string }, i: number) => (
                  <details key={i} className="rounded-lg border bg-card p-4">
                    <summary className="cursor-pointer font-medium">
                      {it.question}
                    </summary>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {it.answer}
                    </p>
                  </details>
                ),
              )}
            </div>
          </section>
        )
      },
    },

    Testimonials: {
      label: 'Testimonials',
      fields: {
        title: { type: 'text' },
        items: {
          type: 'array',
          arrayFields: {
            quote: { type: 'textarea' },
            author: { type: 'text' },
            role: { type: 'text' },
          },
          defaultItemProps: {
            quote: 'This platform changed how we learn.',
            author: 'Jane Doe',
            role: 'Learner',
          },
        },
      },
      defaultProps: {
        title: 'What people say',
        items: [
          {
            quote: 'This platform changed how we learn.',
            author: 'Jane Doe',
            role: 'Learner',
          },
        ],
      },
      render: ({ title, items }) => {
        const list = Array.isArray(items) ? items : []
        return (
          <section className="py-10">
            <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map(
                (
                  t: { quote?: string; author?: string; role?: string },
                  i: number,
                ) => (
                  <figure key={i} className="rounded-lg border bg-card p-6">
                    <blockquote className="text-sm italic">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-3 text-sm font-medium">
                      {t.author}
                      {t.role ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · {t.role}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                ),
              )}
            </div>
          </section>
        )
      },
    },

    Video: {
      label: 'Video embed',
      fields: {
        title: { type: 'text' },
        url: { type: 'text' },
      },
      defaultProps: { title: '', url: '' },
      // Only well-known embed hosts are turned into an iframe; anything else
      // renders as a plain link (never an arbitrary iframe src).
      render: ({ title, url }) => {
        const embed = toEmbedUrl(String(url ?? ''))
        return (
          <section className="py-10">
            {title ? (
              <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
            ) : null}
            {embed ? (
              <div className="relative w-full overflow-hidden rounded-lg pt-[56.25%]">
                <iframe
                  src={embed}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={title || 'Video'}
                />
              </div>
            ) : url ? (
              <a
                href={String(url)}
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                Watch video
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a YouTube or Vimeo URL.
              </p>
            )}
          </section>
        )
      },
    },

    Image: {
      label: 'Image',
      fields: {
        src: { type: 'text' },
        alt: { type: 'text' },
        caption: { type: 'text' },
      },
      defaultProps: { src: '', alt: '', caption: '' },
      render: ({ src, alt, caption }) =>
        src ? (
          <figure className="py-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(src)}
              alt={String(alt ?? '')}
              className="mx-auto max-h-[480px] w-full rounded-lg object-cover"
            />
            {caption ? (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        ) : (
          <div className="my-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Add an image URL.
          </div>
        ),
    },
  },
}

/** Turn a YouTube/Vimeo watch URL into an embeddable URL, or null. */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    if (host === 'vimeo.com') {
      return `https://player.vimeo.com/video${u.pathname}`
    }
    return null
  } catch {
    return null
  }
}

export const emptyPortalData: Data = { content: [], root: {} }
