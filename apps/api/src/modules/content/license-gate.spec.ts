import { describe, expect, it } from 'vitest'

import { canSelfHost } from './license-gate'

describe('license gate — canSelfHost', () => {
  it('allows our own / user / AI-internal content', () => {
    expect(canSelfHost({ sourceType: 'ORIGINAL' }).allowed).toBe(true)
    expect(canSelfHost({ sourceType: 'USER_UPLOADED' }).allowed).toBe(true)
    expect(canSelfHost({ sourceType: 'INTERNAL_GENERATED' }).allowed).toBe(true)
  })

  it('NEVER self-hosts official external resources (reference only)', () => {
    expect(canSelfHost({ sourceType: 'OFFICIAL_EXTERNAL' }).allowed).toBe(false)
  })

  // The critical rule from the spec (Section 34):
  it('blocks third-party files unless self-hosting is explicitly allowed', () => {
    expect(canSelfHost({ sourceType: 'LICENSED', selfHostingAllowed: false }).allowed).toBe(false)
    expect(canSelfHost({ sourceType: 'OPEN_LICENSE' }).allowed).toBe(false) // undefined = not allowed
  })

  it('requires commercial-use + verification even when self-hosting is allowed', () => {
    expect(
      canSelfHost({ sourceType: 'LICENSED', selfHostingAllowed: true, commercialUseAllowed: false }).allowed,
    ).toBe(false)
    expect(
      canSelfHost({
        sourceType: 'LICENSED',
        selfHostingAllowed: true,
        commercialUseAllowed: true,
        licenseVerified: false,
      }).allowed,
    ).toBe(false)
  })

  it('allows a fully-cleared, verified commercial license', () => {
    expect(
      canSelfHost({
        sourceType: 'OPEN_LICENSE',
        selfHostingAllowed: true,
        commercialUseAllowed: true,
        licenseVerified: true,
      }).allowed,
    ).toBe(true)
  })

  it('treats unknown/unset license as NOT self-hostable', () => {
    expect(canSelfHost({ sourceType: 'LICENSED' }).allowed).toBe(false)
  })
})
