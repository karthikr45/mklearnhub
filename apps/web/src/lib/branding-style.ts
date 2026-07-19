import type { CSSProperties } from 'react'

/** Convert a #RRGGBB hex to Tailwind CSS-var HSL parts, e.g. "243 75% 59%". */
function hexToHslParts(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m || !m[1]) return null
  const int = parseInt(m[1], 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Pick a readable foreground (near-black or white) for a hex background. */
function readableForeground(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m || !m[1]) return '0 0% 100%'
  const int = parseInt(m[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  // Relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '240 10% 4%' : '0 0% 100%'
}

export interface BrandingInput {
  primaryColor?: string | null | undefined
  secondaryColor?: string | null | undefined
  accentColor?: string | null | undefined
  fontFamily?: string | null | undefined
}

/**
 * Build a style object that overrides the theme CSS variables the portal
 * blocks use (`--primary`, `--accent`, …) plus the font, from an org's
 * branding. Only valid hex values are applied; anything else is ignored so the
 * default theme shows through.
 */
export function brandingStyle(input: BrandingInput): CSSProperties {
  const style: Record<string, string> = {}

  if (input.primaryColor) {
    const p = hexToHslParts(input.primaryColor)
    if (p) {
      style['--primary'] = p
      style['--primary-foreground'] = readableForeground(input.primaryColor)
      style['--ring'] = p
    }
  }
  if (input.secondaryColor) {
    const s = hexToHslParts(input.secondaryColor)
    if (s) style['--secondary'] = s
  }
  if (input.accentColor) {
    const a = hexToHslParts(input.accentColor)
    if (a) style['--accent'] = a
  }
  if (input.fontFamily) {
    style['fontFamily'] = `${input.fontFamily}, ui-sans-serif, system-ui, sans-serif`
  }

  return style as CSSProperties
}
