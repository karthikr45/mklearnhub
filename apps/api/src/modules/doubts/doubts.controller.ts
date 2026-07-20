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
import { DoubtsService } from './doubts.service'
import { AnswerDoubtDto, CreateDoubtDto } from './dto/doubt.dto'

@ApiTags('doubts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('doubts')
export class DoubtsController {
  constructor(private readonly doubts: DoubtsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('subjectId') subjectId?: string,
    @Query('topicId') topicId?: string,
    @Query('mine') mine?: string,
    @Query('unanswered') unanswered?: string,
  ) {
    return this.doubts.list(user, {
      ...(subjectId ? { subjectId } : {}),
      ...(topicId ? { topicId } : {}),
      mine: mine === 'true',
      unanswered: unanswered === 'true',
    })
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDoubtDto) {
    return this.doubts.create(user, dto)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.doubts.detail(user, id)
  }

  @Post(':id/answers')
  answer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AnswerDoubtDto,
  ) {
    return this.doubts.answer(user, id, dto)
  }

  @Post(':id/vote')
  voteDoubt(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.doubts.voteDoubt(user, id)
  }

  @Post('answers/:answerId/vote')
  voteAnswer(@CurrentUser() user: JwtPayload, @Param('answerId') answerId: string) {
    return this.doubts.voteAnswer(user, answerId)
  }

  @Post('answers/:answerId/accept')
  accept(@CurrentUser() user: JwtPayload, @Param('answerId') answerId: string) {
    return this.doubts.accept(user, answerId)
  }
}
