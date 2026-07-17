export interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  appName?: string
  logoUrl?: string
  hideLearnhubBranding?: boolean
}

/**
 * Apply a branding configuration by writing CSS custom properties onto the
 * document root. No-op on the server (guarded on `document`).
 */
export function applyBranding(config: BrandingConfig): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--brand-primary', config.primaryColor)
  root.style.setProperty('--brand-secondary', config.secondaryColor)
  root.style.setProperty('--brand-accent', config.accentColor)
  root.style.setProperty('--brand-font', config.fontFamily)
}

/**
 * Build a `:root { ... }` CSS string from a branding configuration. Useful for
 * server-rendering a `<style>` tag before hydration.
 */
export function generateThemeCss(config: BrandingConfig): string {
  return `:root {
  --brand-primary: ${config.primaryColor};
  --brand-secondary: ${config.secondaryColor};
  --brand-accent: ${config.accentColor};
  --brand-font: ${config.fontFamily};
}`
}
