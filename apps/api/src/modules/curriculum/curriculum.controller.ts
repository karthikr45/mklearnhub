import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurriculumService } from './curriculum.service'

@ApiTags('curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get('boards')
  boards() {
    return this.curriculum.getBoards()
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
