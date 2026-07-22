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
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CoursesService } from './courses.service'
import { CreateChapterDto } from './dto/create-chapter.dto'
import { CreateCourseDto } from './dto/create-course.dto'
import { CreateLessonDto } from './dto/create-lesson.dto'
import { UpdateProgressDto } from './dto/update-progress.dto'
import { UploadUrlDto } from './dto/upload-url.dto'

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post()
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: JwtPayload) {
    return this.courses.create(this.orgId(user), user.sub, dto)
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.courses.list(this.orgId(user))
  }

  /** Public self-study catalog (platform courses) — no org required. */
  @Get('catalog')
  catalog(@CurrentUser() user: JwtPayload) {
    return this.courses.catalog(user.sub)
  }

  @Post('upload-url')
  getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.courses.getUploadUrl(dto.key)
  }

  @Get('me/enrollments')
  getEnrollments(@CurrentUser() user: JwtPayload) {
    return this.courses.getEnrollments(user.sub)
  }

  @Get('me/certificates')
  getMyCertificates(@CurrentUser() user: JwtPayload) {
    return this.courses.getMyCertificates(user.sub)
  }

  @Post(':courseId/chapters')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  addChapter(
    @Param('courseId') courseId: string,
    @Body() dto: CreateChapterDto,
  ) {
    return this.courses.addChapter(courseId, dto)
  }

  @Post('chapters/:chapterId/lessons')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  addLesson(
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.courses.addLesson(chapterId, dto)
  }

  @Post(':courseId/publish')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  publish(@Param('courseId') courseId: string) {
    return this.courses.publish(courseId)
  }

  @Post(':courseId/enroll')
  enroll(@Param('courseId') courseId: string, @CurrentUser() user: JwtPayload) {
    return this.courses.enroll(user.sub, courseId)
  }

  @Get(':courseId/progress')
  getCourseWithProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.courses.getCourseWithProgress(courseId, user.sub)
  }

  @Post('lessons/:lessonId/progress')
  updateProgress(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.courses.updateProgress(user.sub, lessonId, dto.watchedSecs)
  }

  @Post('enrollments/:enrollmentId/complete')
  completeCourse(@Param('enrollmentId') enrollmentId: string) {
    return this.courses.completeCourse(enrollmentId)
  }

  @Get(':courseId')
  getCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.courses.getCourse(courseId, this.orgId(user))
  }
}
