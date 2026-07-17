import { Injectable, Logger } from '@nestjs/common'

/**
 * Lightweight SAML strategy wrapper.
 *
 * Per-org SAML config is dynamic and boot-unsafe (it would require a live IdP
 * connection at construction), so this is NOT registered as a global Passport
 * strategy. Instead it is a plain injectable that {@link SsoAuthGuard} configures
 * per-request. It imports types only and never connects on construction.
 *
 * Production wiring: build a `@node-saml/node-saml` `SAML` instance lazily inside
 * `validate()` using the org's stored entityId/ssoUrl/x509Certificate, then call
 * `saml.validatePostResponse(body)` to verify the signed assertion.
 */
@Injectable()
export class SamlStrategy {
  private readonly logger = new Logger(SamlStrategy.name)

  /**
   * Validate a SAML POST response for a given org config. Placeholder that
   * defers real signature verification to production (see class doc).
   */
  async validate(
    config: { entityId?: string | null; ssoUrl?: string | null },
    _body: Record<string, unknown>,
  ): Promise<{ verified: boolean }> {
    this.logger.debug(
      `SAML validate invoked for entityId=${config.entityId ?? 'unknown'}`,
    )
    // TODO: verify signature via @node-saml/node-saml in production.
    return { verified: true }
  }
}
