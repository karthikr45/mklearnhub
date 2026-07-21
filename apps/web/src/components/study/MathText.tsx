'use client'

import katex from 'katex'
import 'katex/dist/katex.min.css'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Render a string that may contain LaTeX: `$...$` inline and `$$...$$` block.
 * Plain-text segments are HTML-escaped (XSS-safe for user content like
 * doubts); only KaTeX's own sanitized output is injected as HTML.
 */
function renderMath(input: string): string {
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(input)) !== null) {
    out += escapeHtml(input.slice(last, m.index))
    const tex = m[1] ?? m[2] ?? ''
    const display = m[1] != null
    try {
      out += katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
      })
    } catch {
      out += escapeHtml(m[0])
    }
    last = regex.lastIndex
  }
  out += escapeHtml(input.slice(last))
  return out
}

export function MathText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (!text.includes('$')) {
    return <span className={className}>{text}</span>
  }
  return (
    <span
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderMath(text) }}
    />
  )
}
