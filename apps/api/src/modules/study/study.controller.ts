import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurriculumService } from './curriculum.service'
import { StartPracticeDto, SubmitAttemptDto } from './dto/practice.dto'
import { PracticeService } from './practice.service'
import { ProgressService } from './progress.service'

@ApiTags('study')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('study')
export class StudyController {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly practice: PracticeService,
    private readonly progress: ProgressService,
  ) {}

  // ── Curriculum ──────────────────────────────────────
  @Get('my-tracks')
  myTracks(@CurrentUser() user: JwtPayload) {
    return this.curriculum.myTracks(user.sub)
  }

  @Get('subjects')
  subjects(
    @CurrentUser() user: JwtPayload,
    @Query('examTrack') examTrack?: string,
  ) {
    return this.curriculum.subjects(user.orgId, examTrack)
  }

  @Get('subjects/:id')
  subject(@Param('id') id: string) {
    return this.curriculum.subject(id)
  }

  @Get('chapters/:id')
  chapter(@Param('id') id: string) {
    return this.curriculum.chapter(id)
  }

  // ── Assessments (fixed tests / mocks) ───────────────
  @Get('assessments')
  assessments(
    @CurrentUser() user: JwtPayload,
    @Query('examTrack') examTrack?: string,
  ) {
    return this.practice.listAssessments(user.orgId, examTrack)
  }

  @Post('assessments/:id/start')
  startAssessment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.practice.startAssessment(user.sub, user.orgId, id)
  }

  @Get('assessments/:id/leaderboard')
  leaderboard(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.progress.leaderboard(id, user.sub)
  }

  // ── Syllabus progress tracker ───────────────────────
  @Get('syllabus')
  syllabus(@CurrentUser() user: JwtPayload) {
    return this.progress.syllabus(user.sub, user.orgId)
  }

  // ── Practice + attempts ─────────────────────────────
  @Post('practice/start')
  startPractice(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartPracticeDto,
  ) {
    return this.practice.startPractice(user.sub, user.orgId, dto)
  }

  @Get('attempts')
  history(@CurrentUser() user: JwtPayload) {
    return this.practice.history(user.sub)
  }

  @Post('attempts/:attemptId/submit')
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.practice.submit(user.sub, attemptId, dto)
  }

  @Get('attempts/:attemptId')
  results(
    @CurrentUser() user: JwtPayload,
    @Param('attemptId') attemptId: string,
  ) {
    return this.practice.results(user.sub, attemptId)
  }
}
