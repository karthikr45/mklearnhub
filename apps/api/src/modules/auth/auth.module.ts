import { Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { GoogleStrategy } from './strategies/google.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { RefreshStrategy } from './strategies/refresh.strategy'

// Only register the Google strategy when OAuth credentials are configured.
const optionalProviders: Provider[] = process.env.GOOGLE_CLIENT_ID
  ? [GoogleStrategy]
  : []

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy, ...optionalProviders],
  exports: [AuthService],
})
export class AuthModule {}
