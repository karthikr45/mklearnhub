import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { SsoAuthGuard } from './guards/sso-auth.guard'
import { SamlStrategy } from './strategies/saml.strategy'
import { SsoController } from './sso.controller'
import { SsoService } from './sso.service'

@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [SsoController],
  providers: [SsoService, SamlStrategy, SsoAuthGuard],
  exports: [SsoService],
})
export class SsoModule {}
