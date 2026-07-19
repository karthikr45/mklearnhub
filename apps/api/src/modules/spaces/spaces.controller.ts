import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateArticleDto } from './dto/create-article.dto'
import { CreateManualDto } from './dto/create-manual.dto'
import { CreateSpaceDto } from './dto/create-space.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { SpacesService } from './spaces.service'

@ApiTags('spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post()
  createSpace(@Body() dto: CreateSpaceDto, @CurrentUser() user: JwtPayload) {
    return this.spaces.createSpace(this.orgId(user), dto)
  }

  @Get()
  listSpaces(@CurrentUser() user: JwtPayload) {
    return this.spaces.listSpaces(this.orgId(user))
  }

  @Get('search')
  search(@Query('q') q: string, @CurrentUser() user: JwtPayload) {
    return this.spaces.searchArticles(this.orgId(user), q ?? '')
  }

  @Get('by-slug/:spaceSlug/:manualSlug/:articleSlug')
  getArticleBySlug(
    @Param('spaceSlug') spaceSlug: string,
    @Param('manualSlug') manualSlug: string,
    @Param('articleSlug') articleSlug: string,
  ) {
    return this.spaces.getArticleBySlug(spaceSlug, manualSlug, articleSlug)
  }

  @Post(':spaceId/manuals')
  createManual(@Param('spaceId') spaceId: string, @Body() dto: CreateManualDto) {
    return this.spaces.createManual(spaceId, dto)
  }

  @Get(':spaceId/manuals')
  listManuals(@Param('spaceId') spaceId: string) {
    return this.spaces.listManuals(spaceId)
  }

  @Post('manuals/:manualId/articles')
  createArticle(
    @Param('manualId') manualId: string,
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.spaces.createArticle(manualId, user.sub, dto)
  }

  @Patch('articles/:id')
  updateArticle(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.spaces.updateArticle(id, dto, user.sub)
  }

  @Post('articles/:id/publish')
  publishArticle(@Param('id') id: string) {
    return this.spaces.publishArticle(id)
  }

  @Get('articles/:id/history')
  getArticleHistory(@Param('id') id: string) {
    return this.spaces.getArticleHistory(id)
  }

  @Get('articles/:id')
  getArticleById(@Param('id') id: string) {
    return this.spaces.getArticleById(id)
  }

  @Get('manuals/:manualId')
  getManual(@Param('manualId') manualId: string) {
    return this.spaces.getManual(manualId)
  }

  @Get(':spaceId')
  getSpace(@Param('spaceId') spaceId: string) {
    return this.spaces.getSpace(spaceId)
  }
}
