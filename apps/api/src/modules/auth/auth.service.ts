import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { Prisma, User } from '@learnhub/db'
import type { AuthTokens, AuthUser, JwtPayload } from '@learnhub/types'
import { comparePassword, hashPassword, slugify } from '@learnhub/utils'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

interface GoogleProfile {
  provider: string
  providerUserId: string
  email?: string
  name: string
  avatarUrl?: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.organizationId,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    }
  }

  async generateTokens(user: User, sessionId: string): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
      sessionId,
    }
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    })
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    })
    return { accessToken, refreshToken }
  }

  private async createSession(userId: string, refreshToken: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return this.prisma.session.create({
      data: { userId, refreshToken, expiresAt },
    })
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new ConflictException('Email already registered')

    const passwordHash = await hashPassword(dto.password)
    const userData: Prisma.UserCreateInput = {
      email: dto.email,
      name: dto.name,
      passwordHash,
    }

    if (dto.inviteToken) {
      const invite = await this.prisma.invite.findUnique({
        where: { token: dto.inviteToken },
      })
      if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired invite')
      }
      userData.organization = { connect: { id: invite.organizationId } }
      userData.role = invite.role
    } else if (dto.orgName) {
      userData.organization = {
        create: { name: dto.orgName, slug: `${slugify(dto.orgName)}-${nanoid(6)}` },
      }
      userData.role = 'ORG_ADMIN'
    }

    const user = await this.prisma.user.create({ data: userData })

    if (dto.inviteToken) {
      await this.prisma.invite.update({
        where: { token: dto.inviteToken },
        data: { acceptedAt: new Date() },
      })
    }

    // In production this token is emailed; in dev we log it.
    const verifyToken = await this.jwt.signAsync(
      { sub: user.id, purpose: 'verify-email' },
      { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '1d' },
    )
    this.logger.log(`Email verification token for ${user.email}: ${verifyToken}`)

    const { refreshToken, accessToken } = await this.generateTokens(user, nanoid())
    await this.createSession(user.id, refreshToken)
    return { user: this.toAuthUser(user), tokens: { accessToken, refreshToken } }
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const valid = await comparePassword(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')
    if (!user.isActive) throw new UnauthorizedException('Account disabled')

    const tokens = await this.generateTokens(user, nanoid())
    await this.createSession(user.id, tokens.refreshToken)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    return { user: this.toAuthUser(user), tokens }
  }

  async logout(refreshToken: string): Promise<{ success: boolean }> {
    await this.prisma.session.deleteMany({ where: { refreshToken } })
    return { success: true }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    })
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token')
    }
    const tokens = await this.generateTokens(session.user, nanoid())
    // Rotate: replace the old session's refresh token.
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    return tokens
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; purpose: string }>(
        token,
        { secret: this.config.get<string>('JWT_SECRET') },
      )
      if (payload.purpose !== 'verify-email') throw new Error('bad purpose')
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerified: true },
      })
      return { success: true }
    } catch {
      throw new BadRequestException('Invalid or expired verification token')
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    // Always return success to avoid leaking which emails exist.
    if (user) {
      const token = await this.jwt.signAsync(
        { sub: user.id, purpose: 'reset-password' },
        { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '1h' },
      )
      this.logger.log(`Password reset token for ${user.email}: ${token}`)
    }
    return { success: true }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; purpose: string }>(
        dto.token,
        { secret: this.config.get<string>('JWT_SECRET') },
      )
      if (payload.purpose !== 'reset-password') throw new Error('bad purpose')
      const passwordHash = await hashPassword(dto.password)
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      })
      // Invalidate all existing sessions.
      await this.prisma.session.deleteMany({ where: { userId: payload.sub } })
      return { success: true }
    } catch {
      throw new BadRequestException('Invalid or expired reset token')
    }
  }

  async googleCallback(
    profile: GoogleProfile,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (!profile.email) throw new BadRequestException('Google account has no email')

    let user = await this.prisma.user.findUnique({ where: { email: profile.email } })
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          emailVerified: true,
          ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
          oauthAccounts: {
            create: {
              provider: profile.provider,
              providerUserId: profile.providerUserId,
            },
          },
        },
      })
    }
    const tokens = await this.generateTokens(user, nanoid())
    await this.createSession(user.id, tokens.refreshToken)
    return { user: this.toAuthUser(user), tokens }
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()
    return this.toAuthUser(user)
  }
}
