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
import type {
  AuthTokens,
  AuthUser,
  JwtPayload,
  LearnerProfile,
} from '@learnhub/types'
import { comparePassword, hashPassword, slugify } from '@learnhub/utils'
import { validate as validatePassword } from '@learnhub/compliance'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { SaveLearnerProfileDto } from './dto/learner-profile.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RegisterParentDto } from './dto/register-parent.dto'
import { RegisterStudentDto } from './dto/register-student.dto'
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
    private readonly audit: AuditService,
  ) {}

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.organizationId,
      onboarded: user.onboarded,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    }
  }

  /** Marks the current user as having finished the onboarding wizard. */
  async markOnboarded(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { onboarded: true },
    })
    return this.toAuthUser(user)
  }

  private toLearnerProfile(user: {
    learnerTrack: string | null
    learnerBoard: string | null
    learnerClass: string | null
    learnerYear: string | null
    learnerStream: string | null
    examTargets: string[]
    interests: string[]
  }): LearnerProfile {
    return {
      track: (user.learnerTrack as LearnerProfile['track']) ?? null,
      board: user.learnerBoard,
      classLevel: user.learnerClass,
      year: user.learnerYear,
      stream: user.learnerStream,
      examTargets: user.examTargets,
      interests: user.interests,
    }
  }

  async getLearnerProfile(userId: string): Promise<LearnerProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        learnerTrack: true,
        learnerBoard: true,
        learnerClass: true,
        learnerYear: true,
        learnerStream: true,
        examTargets: true,
        interests: true,
      },
    })
    if (!user) throw new UnauthorizedException()
    return this.toLearnerProfile(user)
  }

  /**
   * Saves a self-study learner's education profile. Fields not relevant to the
   * chosen track are cleared, so switching tracks never leaves stale details.
   */
  async saveLearnerProfile(
    userId: string,
    dto: SaveLearnerProfileDto,
  ): Promise<LearnerProfile> {
    const academic = dto.track === 'SCHOOL' || dto.track === 'INTERMEDIATE'
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        learnerTrack: dto.track as never,
        learnerBoard: academic ? ((dto.board as never) ?? null) : null,
        learnerClass: academic ? (dto.classLevel ?? null) : null,
        learnerYear: academic ? (dto.year ?? null) : null,
        learnerStream:
          dto.track === 'INTERMEDIATE' ? (dto.stream ?? null) : null,
        examTargets:
          dto.track === 'ENGINEERING' || dto.track === 'MBA'
            ? (dto.examTargets ?? [])
            : [],
        interests: dto.track === 'OTHER' ? (dto.interests ?? []) : [],
      },
      select: {
        learnerTrack: true,
        learnerBoard: true,
        learnerClass: true,
        learnerYear: true,
        learnerStream: true,
        examTargets: true,
        interests: true,
      },
    })
    return this.toLearnerProfile(user)
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

  /**
   * Student self-registration via a batch join code. The code is the security
   * gate: it binds the new STUDENT to a real school + academic year + class,
   * so children only ever end up alongside verified classmates.
   */
  async registerStudent(
    dto: RegisterStudentDto,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new ConflictException('Email already registered')

    const policy = validatePassword(dto.password)
    if (!policy.valid) {
      throw new BadRequestException(policy.errors.join('; '))
    }

    const code = dto.joinCode.trim().toUpperCase()
    const batch = await this.prisma.batch.findUnique({
      where: { joinCode: code },
      include: { organization: { select: { id: true, name: true } } },
    })
    if (!batch) {
      throw new BadRequestException('Invalid class join code')
    }
    if (batch.maxStudents) {
      const count = await this.prisma.batchStudent.count({
        where: { batchId: batch.id },
      })
      if (count >= batch.maxStudents) {
        throw new BadRequestException('This class is full')
      }
    }

    const passwordHash = await hashPassword(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: 'STUDENT',
        termsAcceptedAt: new Date(),
        parentalConsentAt: new Date(),
        organization: { connect: { id: batch.organizationId } },
        batchStudents: { create: { batchId: batch.id } },
      },
    })

    const { refreshToken, accessToken } = await this.generateTokens(user, nanoid())
    await this.createSession(user.id, refreshToken)
    return { user: this.toAuthUser(user), tokens: { accessToken, refreshToken } }
  }

  /**
   * Parent self-registration via a child's parent-link code. Creates a PARENT
   * in the same school and links them to that student.
   */
  async registerParent(
    dto: RegisterParentDto,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new ConflictException('Email already registered')

    const policy = validatePassword(dto.password)
    if (!policy.valid) throw new BadRequestException(policy.errors.join('; '))

    const code = dto.code.trim().toUpperCase()
    const child = await this.prisma.user.findUnique({
      where: { parentLinkCode: code },
      select: { id: true, organizationId: true },
    })
    if (!child) throw new BadRequestException('Invalid parent invite code')

    const passwordHash = await hashPassword(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: 'PARENT',
        termsAcceptedAt: new Date(),
        ...(child.organizationId
          ? { organization: { connect: { id: child.organizationId } } }
          : {}),
        parentLinks: { create: { studentId: child.id, relation: 'parent' } },
      },
    })

    const { refreshToken, accessToken } = await this.generateTokens(user, nanoid())
    await this.createSession(user.id, refreshToken)
    return { user: this.toAuthUser(user), tokens: { accessToken, refreshToken } }
  }

  /** Public preview of a parent-link code before a parent registers. */
  async getParentInvite(code: string) {
    const child = await this.prisma.user.findUnique({
      where: { parentLinkCode: code.trim().toUpperCase() },
      select: {
        name: true,
        role: true,
        organization: { select: { name: true } },
      },
    })
    if (!child || child.role !== 'STUDENT') return { valid: false as const }
    return {
      valid: true as const,
      studentName: child.name,
      schoolName: child.organization?.name ?? null,
    }
  }

  /** A student generates (or fetches) the code to share with a parent. */
  async getOrCreateParentCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, parentLinkCode: true },
    })
    if (!user || user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can invite a parent')
    }
    if (user.parentLinkCode) return { code: user.parentLinkCode }
    const code = `PC-${nanoid(6).toUpperCase()}`
    await this.prisma.user.update({
      where: { id: userId },
      data: { parentLinkCode: code },
    })
    return { code }
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new ConflictException('Email already registered')

    const policy = validatePassword(dto.password)
    if (!policy.valid) {
      throw new BadRequestException(policy.errors.join('; '))
    }

    const passwordHash = await hashPassword(dto.password)
    const userData: Prisma.UserCreateInput = {
      email: dto.email,
      name: dto.name,
      passwordHash,
      termsAcceptedAt: new Date(),
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
        create: {
          name: dto.orgName,
          slug: `${slugify(dto.orgName)}-${nanoid(6)}`,
          ...(dto.orgType ? { type: dto.orgType as never } : {}),
        },
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
    await this.audit.log({
      action: 'user.login',
      resource: 'User',
      resourceId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
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
