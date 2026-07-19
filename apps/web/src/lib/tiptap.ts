// Helpers to convert between plain textarea text and the TipTap-style
// document JSON the Knowledge Base API stores as article content.
//
// Document shape:
//   { type: 'doc', content: [
//     { type: 'paragraph', content: [ { type: 'text', text: '…' } ] },
//   ] }

export interface TiptapDoc {
  type: 'doc'
  content: unknown[]
}

/**
 * Convert plain text (from a <textarea>) into a TipTap doc.
 * Blank lines separate paragraphs; empty paragraphs are dropped.
 */
export function textToDoc(text: string): TiptapDoc {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)

  const content = paragraphs.map((block) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: block }],
  }))

  return { type: 'doc', content }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Walk a TipTap doc (defensively) and extract its text, joining paragraphs
 * with blank lines so it round-trips through <textarea> + textToDoc.
 */
export function docToText(doc: unknown): string {
  // Already plain text (older records or fallbacks).
  if (typeof doc === 'string') return doc
  if (!isRecord(doc)) return ''

  const topContent = doc.content
  if (!Array.isArray(topContent)) return ''

  const paragraphs: string[] = []

  for (const node of topContent) {
    if (!isRecord(node)) continue
    const inline = node.content
    if (!Array.isArray(inline)) {
      // Node with no inline content (e.g. empty paragraph) → blank line.
      paragraphs.push('')
      continue
    }
    const parts: string[] = []
    for (const child of inline) {
      if (isRecord(child) && typeof child.text === 'string') {
        parts.push(child.text)
      }
    }
    paragraphs.push(parts.join(''))
  }

  return paragraphs.join('\n\n').trim()
}
