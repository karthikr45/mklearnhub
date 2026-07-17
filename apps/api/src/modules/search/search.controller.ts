import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SearchFilters, SearchService } from './search.service'

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Get()
  query(
    @Query('q') q: string,
    @Query('type') type: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const filters: SearchFilters | undefined =
      type === 'course' || type === 'article' ? { type } : undefined
    return this.search.search(this.orgId(user), q ?? '', filters)
  }
}
