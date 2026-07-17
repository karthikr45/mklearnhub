import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20'

/**
 * Only registered when GOOGLE_CLIENT_ID/SECRET are configured (see AuthModule).
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', 'not-configured'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', 'not-configured'),
      callbackURL: `${config.get<string>('APP_URL', 'http://localhost:3001')}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value
    done(null, {
      provider: 'google',
      providerUserId: profile.id,
      email,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    })
  }
}
