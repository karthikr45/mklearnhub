import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { FastifyRequest } from 'fastify'
import type { JwtPayload } from '@learnhub/types'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(
        'JWT_REFRESH_SECRET',
        'dev-refresh-secret-change-me',
      ),
      passReqToCallback: true,
    })
  }

  validate(req: FastifyRequest, payload: JwtPayload): JwtPayload & { refreshToken: string } {
    const body = req.body as { refreshToken?: string }
    return { ...payload, refreshToken: body?.refreshToken ?? '' }
  }
}
