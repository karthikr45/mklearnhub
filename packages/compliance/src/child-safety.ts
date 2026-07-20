/**
 * Child-safety content moderation.
 *
 * A deterministic, offline first-line screen applied to EVERY message and
 * shared resource in student study groups. It is intentionally conservative:
 * school children must never be exposed to adult, violent, self-harm or
 * predatory ("grooming") content, and un-screenable media is not allowed at
 * all.
 *
 * This is a keyword/heuristic layer — not a replacement for human review.
 * Every decision is meant to be logged (see ModerationEvent) so school staff
 * can audit and improve it. Higher tiers can layer an ML/vision classifier on
 * top; the API contract here (`moderateText` / `moderateResource`) stays the
 * same.
 */

export type ModerationStatus = 'APPROVED' | 'BLOCKED' | 'FLAGGED'

export interface ModerationResult {
  status: ModerationStatus
  /** Human-readable categories that triggered, e.g. ['adult', 'profanity']. */
  reasons: string[]
  /** The normalized tokens/patterns that matched (for the audit log). */
  matched: string[]
}

/**
 * Blocked term categories. Kept as word stems matched against normalized
 * text. Explicit sexual/abusive terms are deliberately included so the filter
 * actually protects children; they are data, not prose.
 */
const BLOCKLIST: Record<string, string[]> = {
  adult: [
    'sex', 'porn', 'porno', 'xxx', 'nude', 'nudes', 'naked', 'boobs', 'boob',
    'tits', 'penis', 'vagina', 'dick', 'cock', 'pussy', 'cum', 'orgasm',
    'horny', 'fuck', 'fucking', 'blowjob', 'handjob', 'anal', 'nsfw',
    'onlyfans', 'hentai', 'milf', 'escort', 'sexy', 'sexting', 'strip',
    'masturbate', 'masturbation', 'erotic', 'fetish', 'bdsm', 'orgy',
  ],
  profanity: [
    'bitch', 'bastard', 'asshole', 'slut', 'whore', 'motherfucker', 'bollocks',
    'wanker', 'randi', 'gaand', 'lund', 'chutiya', 'chutia', 'madarchod',
    'behenchod', 'bhenchod', 'bsdk', 'lauda',
  ],
  hate: [
    'nigger', 'faggot', 'retard', 'raghead', 'chink', 'kike',
  ],
  violence: [
    'kill yourself', 'kys', 'murder you', 'shoot you', 'stab you', 'bomb',
    'gun for sale', 'behead',
  ],
  selfharm: [
    'suicide', 'self harm', 'selfharm', 'cut myself', 'cutting myself',
    'end my life', 'want to die', 'kill myself',
  ],
  drugs: [
    'cocaine', 'heroin', 'weed', 'marijuana', 'ganja', 'lsd', 'mdma', 'meth',
    'vape', 'cigarette', 'cigarettes', 'alcohol', 'whisky', 'vodka', 'beer',
  ],
  grooming: [
    'send nudes', 'send pic', 'send pics', 'meet me alone', 'dont tell',
    "don't tell your parents", 'dont tell your parents', 'our secret',
    'keep this secret', 'send your photo', 'video call alone', 'whatsapp me',
    'my number is', 'add me on', 'meet in person', 'come to my place',
  ],
}

/** Leet-speak / obfuscation map so "p0rn", "s3x", "f_u_c_k" still match. */
const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
  '9': 'g', '@': 'a', '$': 's', '!': 'i', '|': 'i',
}

/**
 * Normalize text for matching:
 *  - lowercase
 *  - map common leet chars to letters
 *  - collapse 3+ repeated letters ("fuuuuck" -> "fuuck" -> handled by stem)
 *  - keep single spaces so multi-word phrases still match
 */
function normalize(input: string): string {
  const lowered = input.toLowerCase()
  let out = ''
  for (const ch of lowered) {
    out += LEET[ch] ?? ch
  }
  // strip anything that isn't a letter, digit or space (removes . _ - * etc.
  // used to break up words), then collapse whitespace.
  out = out.replace(/[^a-z0-9\s]/g, '')
  out = out.replace(/([a-z])\1{2,}/g, '$1$1') // fuuuu -> fuu
  out = out.replace(/\s+/g, ' ').trim()
  return out
}

/** A de-spaced variant catches "f u c k" / "s.e.x" style evasion. */
function despace(normalized: string): string {
  return normalized.replace(/\s+/g, '')
}

/**
 * Screen a piece of user text (chat message, note, resource title, link).
 * Adult / profanity / hate / violence / self-harm / grooming → BLOCKED.
 * Contact-info sharing (phone / email) → FLAGGED (allowed but surfaced to
 * staff, since it's a classic grooming/privacy risk for minors).
 */
export function moderateText(text: string): ModerationResult {
  const reasons = new Set<string>()
  const matched = new Set<string>()

  const norm = normalize(text)
  const packed = despace(norm)
  const spacedWords = new Set(norm.split(' '))

  for (const [category, terms] of Object.entries(BLOCKLIST)) {
    for (const term of terms) {
      if (term.includes(' ')) {
        // multi-word phrase: check within normalized (spaced) text
        if (norm.includes(term)) {
          reasons.add(category)
          matched.add(term)
        }
      } else {
        // single token: exact word OR embedded in the de-spaced string
        // (so "f u c k" and "lookatthissexsite" both trip).
        if (spacedWords.has(term) || packed.includes(term)) {
          reasons.add(category)
          matched.add(term)
        }
      }
    }
  }

  // Contact-info solicitation — flag, don't hard-block.
  const phone = /\b(?:\+?\d[\s-]?){10,}\b/
  const email = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  if (phone.test(text) || email.test(text)) {
    reasons.add('contact-info')
    matched.add('contact-info')
  }

  const hardCategories = [
    'adult', 'profanity', 'hate', 'violence', 'selfharm', 'drugs', 'grooming',
  ]
  const hasHard = [...reasons].some((r) => hardCategories.includes(r))

  const status: ModerationStatus = hasHard
    ? 'BLOCKED'
    : reasons.size > 0
      ? 'FLAGGED'
      : 'APPROVED'

  return { status, reasons: [...reasons], matched: [...matched] }
}

/**
 * File types a STUDENT may share in a school study group. Study material
 * only — documents, spreadsheets, slides, plain text. Images and video are
 * intentionally excluded: without automated visual moderation we cannot
 * guarantee they are age-appropriate, so we do not allow un-screenable media.
 */
export const ALLOWED_STUDENT_FILE_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'odt',
] as const

const BLOCKED_LINK_DOMAINS = [
  'pornhub', 'xvideos', 'xnxx', 'onlyfans', 'redtube', 'xhamster',
  'brazzers', 'chaturbate', 'youporn', 'rule34', 'nhentai',
]

export interface ResourceInput {
  type: 'NOTE' | 'LINK' | 'FILE'
  title: string
  body?: string | undefined
  url?: string | undefined
  fileName?: string | undefined
}

/**
 * Screen a shared resource. Combines text moderation (title/body/url) with a
 * file-type allowlist and an adult-domain blocklist for links.
 */
export function moderateResource(input: ResourceInput): ModerationResult {
  const reasons = new Set<string>()
  const matched = new Set<string>()

  const textPart = [input.title, input.body, input.url]
    .filter(Boolean)
    .join(' ')
  const textResult = moderateText(textPart)
  textResult.reasons.forEach((r) => reasons.add(r))
  textResult.matched.forEach((m) => matched.add(m))

  if (input.type === 'LINK' && input.url) {
    const host = input.url.toLowerCase()
    for (const dom of BLOCKED_LINK_DOMAINS) {
      if (host.includes(dom)) {
        reasons.add('adult')
        matched.add(dom)
      }
    }
  }

  if (input.type === 'FILE') {
    const name = (input.fileName ?? '').toLowerCase()
    const ext = name.includes('.') ? name.split('.').pop() ?? '' : ''
    const allowed = (ALLOWED_STUDENT_FILE_EXTENSIONS as readonly string[]).includes(ext)
    if (!allowed) {
      reasons.add('disallowed-file-type')
      matched.add(ext || 'unknown')
    }
  }

  const blockCategories = [
    'adult', 'profanity', 'hate', 'violence', 'selfharm', 'drugs', 'grooming',
    'disallowed-file-type',
  ]
  const hasBlock = [...reasons].some((r) => blockCategories.includes(r))
  const status: ModerationStatus = hasBlock
    ? 'BLOCKED'
    : reasons.size > 0
      ? 'FLAGGED'
      : 'APPROVED'

  return { status, reasons: [...reasons], matched: [...matched] }
}
