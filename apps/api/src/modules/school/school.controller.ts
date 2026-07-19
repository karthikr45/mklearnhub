import {
  Body,
  Controller,
  ForbiddenException,
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
import { AddStudentsDto } from './dto/add-students.dto'
import { CreateBatchDto } from './dto/create-batch.dto'
import { CreateTimetableDto } from './dto/create-timetable.dto'
import { LinkParentDto } from './dto/link-parent.dto'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'
import { RecordGradeDto } from './dto/record-grade.dto'
import { SchoolService } from './school.service'

@ApiTags('school')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('school')
export class SchoolController {
  constructor(private readonly school: SchoolService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Get('me/overview')
  getStudentOverview(@CurrentUser() user: JwtPayload) {
    return this.school.getStudentOverview(user.sub)
  }

  @Post('batches')
  createBatch(@Body() dto: CreateBatchDto, @CurrentUser() user: JwtPayload) {
    return this.school.createBatch(this.orgId(user), dto)
  }

  @Get('batches')
  listBatches(@CurrentUser() user: JwtPayload) {
    return this.school.listBatches(this.orgId(user))
  }

  @Get('batches/:batchId')
  getBatch(@Param('batchId') batchId: string) {
    return this.school.getBatch(batchId)
  }

  @Get('batches/:batchId/timetable')
  getTimetable(@Param('batchId') batchId: string) {
    return this.school.getTimetable(batchId)
  }

  @Post('batches/:batchId/students')
  addStudents(
    @Param('batchId') batchId: string,
    @Body() dto: AddStudentsDto,
  ) {
    return this.school.addStudentsToBatch(batchId, dto.userIds)
  }

  @Post('batches/:batchId/timetable')
  createTimetable(
    @Param('batchId') batchId: string,
    @Body() dto: CreateTimetableDto,
  ) {
    return this.school.createTimetable(batchId, dto.slots)
  }

  @Post('batches/:batchId/attendance')
  markAttendance(
    @Param('batchId') batchId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.school.markAttendance(batchId, dto.date, dto.records)
  }

  @Get('batches/:batchId/attendance')
  getAttendanceReport(
    @Param('batchId') batchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.school.getAttendanceReport(batchId, startDate, endDate)
  }

  @Post('students/:studentId/grades')
  recordGrade(
    @Param('studentId') studentId: string,
    @Body() dto: RecordGradeDto,
  ) {
    return this.school.recordGrade(studentId, dto)
  }

  @Get('students/:studentId/grades')
  getGradeCard(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.school.getGradeCard(studentId, academicYearId)
  }

  @Post('parents/:parentId/children')
  linkParentStudent(
    @Param('parentId') parentId: string,
    @Body() dto: LinkParentDto,
  ) {
    return this.school.linkParentStudent(parentId, dto.studentId)
  }

  @Get('parents/:parentId/children')
  getChildrenForParent(@Param('parentId') parentId: string) {
    return this.school.getChildrenForParent(parentId)
  }
}
