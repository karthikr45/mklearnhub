import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AssessmentsService } from './assessments.service'
import { AddQuestionDto } from './dto/add-question.dto'
import { CreateAssignmentDto } from './dto/create-assignment.dto'
import { CreateQuizDto } from './dto/create-quiz.dto'
import { GenerateQuestionsDto } from './dto/generate-questions.dto'
import { GradeSubmissionDto } from './dto/grade-submission.dto'
import { SubmitAssignmentDto } from './dto/submit-assignment.dto'
import { SubmitAttemptDto } from './dto/submit-attempt.dto'

@ApiTags('assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post('quizzes')
  createQuiz(@Body() dto: CreateQuizDto, @CurrentUser() user: JwtPayload) {
    return this.assessments.createQuiz(this.orgId(user), dto)
  }

  @Get('quizzes')
  listQuizzes(@CurrentUser() user: JwtPayload) {
    return this.assessments.listQuizzes(this.orgId(user))
  }

  @Get('quizzes/:quizId')
  getQuiz(@Param('quizId') quizId: string) {
    return this.assessments.getQuiz(quizId)
  }

  @Post('quizzes/:quizId/questions')
  addQuestion(@Param('quizId') quizId: string, @Body() dto: AddQuestionDto) {
    return this.assessments.addQuestion(quizId, dto)
  }

  @Post('quizzes/:quizId/start')
  startAttempt(
    @Param('quizId') quizId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessments.startAttempt(user.sub, quizId)
  }

  @Post('quizzes/:quizId/submit')
  submitAttempt(
    @Param('quizId') quizId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessments.submitAttempt(user.sub, quizId, dto.answers)
  }

  @Post('assignments')
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessments.createAssignment(this.orgId(user), dto)
  }

  @Post('assignments/:assignmentId/submit')
  submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessments.submitAssignment(user.sub, assignmentId, dto)
  }

  @Post('submissions/:submissionId/grade')
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assessments.gradeSubmission(
      submissionId,
      dto.score,
      dto.feedback,
    )
  }

  @Post('generate-questions')
  generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.assessments.generateQuestionsFromAI(dto.content, dto.count ?? 5)
  }
}
