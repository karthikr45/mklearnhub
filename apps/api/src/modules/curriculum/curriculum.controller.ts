import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CurriculumImportService } from './curriculum-import.service'
import { CurriculumService } from './curriculum.service'

class ImportCsvDto {
  @IsString()
  csv!: string
}

@ApiTags('curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly importer: CurriculumImportService,
  ) {}

  /** Load a verified syllabus from CSV (admin only). Idempotent. */
  @Post('import')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  importCsv(@Body() dto: ImportCsvDto) {
    return this.importer.importCsv(dto.csv)
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
}
