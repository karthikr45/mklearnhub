/**
 * The single most important legal-safety rule in the content system:
 * a third-party file may NOT be copied into our managed object storage unless
 * self-hosting is explicitly permitted, commercial use is compatible, and the
 * license has been verified. Unknown license ⇒ never self-hostable.
 *
 * This is deliberately a pure function so it can be unit-tested in isolation
 * (see license-gate.spec.ts) and reused by both the upload and ingestion paths.
 */

export type ContentSourceTypeStr =
  | 'ORIGINAL'
  | 'OPEN_LICENSE'
  | 'LICENSED'
  | 'OFFICIAL_EXTERNAL'
  | 'USER_UPLOADED'
  | 'INTERNAL_GENERATED'

export interface LicenseInput {
  sourceType: ContentSourceTypeStr
  selfHostingAllowed?: boolean | null
  commercialUseAllowed?: boolean | null
  licenseVerified?: boolean | null
  /**
   * Explicit per-file opt-in to host an OFFICIAL_EXTERNAL resource (e.g. an
   * NCERT textbook) unchanged, with attribution, for free/educational use.
   * A super-admin decision — the default is still reference-only.
   */
  officialHostingAcknowledged?: boolean | null
}

export interface GateResult {
  allowed: boolean
  reason?: string
}

/** Source types whose files we own / are licensed to host by their nature. */
const OWNED_SOURCES: ReadonlySet<ContentSourceTypeStr> = new Set([
  'ORIGINAL',
  'INTERNAL_GENERATED',
  'USER_UPLOADED',
])

/**
 * May this asset's file be uploaded/copied into our storage?
 *
 * - Owned/original/user-uploaded/AI-internal → yes (still needs review before
 *   publish, but hosting is fine).
 * - OFFICIAL_EXTERNAL → never self-host — reference by URL only.
 * - OPEN_LICENSE / LICENSED → only if selfHostingAllowed AND commercialUseAllowed
 *   AND the license has been verified.
 * - Anything with an unclear/unverified license → no.
 */
export function canSelfHost(input: LicenseInput): GateResult {
  if (OWNED_SOURCES.has(input.sourceType)) return { allowed: true }

  if (input.sourceType === 'OFFICIAL_EXTERNAL') {
    // Default: reference-only. A super-admin may explicitly opt in to hosting
    // an official resource unchanged, attributed and free (e.g. NCERT books).
    if (input.officialHostingAcknowledged === true) return { allowed: true }
    return {
      allowed: false,
      reason:
        'Official resources are reference-only unless you confirm hosting them unchanged, attributed and free.',
    }
  }

  // OPEN_LICENSE / LICENSED
  if (input.selfHostingAllowed !== true) {
    return { allowed: false, reason: 'Self-hosting is not permitted for this license.' }
  }
  if (input.commercialUseAllowed !== true) {
    return {
      allowed: false,
      reason: 'Commercial use is not permitted, which is incompatible with this platform.',
    }
  }
  if (input.licenseVerified !== true) {
    return { allowed: false, reason: 'The license has not been verified yet.' }
  }
  return { allowed: true }
}
