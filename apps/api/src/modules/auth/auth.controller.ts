import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'
import type { JwtPayload } from '@learnhub/types'

import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { RegisterDto } from './dto/register.dto'
import { RegisterStudentDto } from './dto/register-student.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

interface OAuthRequest {
  user?: {
    provider: string
    providerUserId: string
    email?: string
    name: string
    avatarUrl?: string
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('register/student')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.auth.registerStudent(dto)
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken)
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refreshTokens(dto.refreshToken)
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.auth.verifyEmail(token)
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto)
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto)
  }

  @Get('google')
  google() {
    return {
      message: 'Configure GOOGLE_CLIENT_ID/SECRET and add @UseGuards(AuthGuard("google")).',
    }
  }

  @Get('google/callback')
  async googleCallback(@Req() req: OAuthRequest, @Res() res: FastifyReply) {
    if (!req.user) throw new UnauthorizedException('Google auth failed')
    const result = await this.auth.googleCallback(req.user)
    const url = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/auth/callback?token=${result.tokens.accessToken}&refresh=${result.tokens.refreshToken}`
    return res.redirect(url)
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub)
  }
}
