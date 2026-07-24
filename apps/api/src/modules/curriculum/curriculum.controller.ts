import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  Allow,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CurriculumAdminService } from './curriculum-admin.service'
import { CurriculumImportService } from './curriculum-import.service'
import { CurriculumQuestionsService } from './curriculum-questions.service'
import { CurriculumService } from './curriculum.service'

class ImportCsvDto {
  @IsString()
  csv!: string
}

class CreateNodeDto {
  @IsOptional() @IsString() parentId?: string
  @IsString() title!: string
  @IsOptional() @IsString() code?: string
  @IsOptional() @IsInt() order?: number
  @IsOptional() @IsString() unitId?: string
  @IsOptional() @IsString() bookId?: string
}

class UpdateNodeDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() code?: string
  @IsOptional() @IsInt() order?: number
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() unitId?: string | null
  @IsOptional() @IsString() bookId?: string | null
}

class CreateQuestionDto {
  @IsString() text!: string
  @IsOptional() @IsString() type?: string
  @IsOptional() @IsString() difficulty?: string
  @IsOptional() @IsArray() options?: { id: string; text: string }[]
  @Allow() correctAnswer!: unknown
  @IsOptional() @IsString() explanation?: string
  @IsOptional() @IsInt() marks?: number
  @IsOptional() @IsNumber() negativeMarks?: number
}

@ApiTags('curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly importer: CurriculumImportService,
    private readonly admin: CurriculumAdminService,
    private readonly questions: CurriculumQuestionsService,
  ) {}

  /** Load a verified syllabus from CSV (admin only). Idempotent. */
  @Post('import')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  importCsv(@Body() dto: ImportCsvDto) {
    return this.importer.importCsv(dto.csv)
  }

  // ── Generic node CRUD (admin) — board/year/grade/subject/unit/book/
  //    chapter/topic/subtopic/objective ──
  @Post('nodes/:type')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  createNode(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Body() dto: CreateNodeDto,
  ) {
    return this.admin.create(user.sub, type, dto)
  }

  @Patch('nodes/:type/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  updateNode(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: UpdateNodeDto,
  ) {
    return this.admin.update(user.sub, type, id, dto)
  }

  @Delete('nodes/:type/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  deleteNode(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.admin.remove(user.sub, type, id)
  }

  @Get('boards')
  boards() {
    return this.curriculum.getBoards()
  }

  /** The curriculum for the signed-in learner, resolved from their profile. */
  @Get('for-me')
  forMe(@CurrentUser() user: JwtPayload) {
    return this.curriculum.getForLearner(user.sub)
  }

  /** A single published content asset (with delivery URL) for students. */
  @Get('content/:id')
  content(@Param('id') id: string) {
    return this.curriculum.getPublishedContent(id)
  }

  @Get('tree')
  tree(@Query('boardId') boardId?: string, @Query('yearId') yearId?: string) {
    return this.curriculum.getTree(boardId, yearId)
  }

  @Get('subjects/:id')
  subject(@Param('id') id: string) {
    return this.curriculum.getSubject(id)
  }

  @Get('nodes/:nodeType/:nodeId/content')
  nodeContent(
    @Param('nodeType') nodeType: string,
    @Param('nodeId') nodeId: string,
    @Query('all') all?: string,
  ) {
    return this.curriculum.getNodeContent(nodeType, nodeId, all === 'true')
  }

  // ── Curriculum-native question bank (admin) ─────────────
  @Get('nodes/:nodeType/:nodeId/questions')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  listQuestions(
    @Param('nodeType') nodeType: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.questions.list(nodeType, nodeId)
  }

  @Post('nodes/:nodeType/:nodeId/questions')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  createQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('nodeType') nodeType: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questions.create(
      user.sub,
      user.orgId,
      user.role,
      nodeType,
      nodeId,
      dto,
    )
  }

  @Delete('question-mappings/:mappingId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  deleteQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('mappingId') mappingId: string,
  ) {
    return this.questions.remove(user.sub, mappingId)
  }
}
