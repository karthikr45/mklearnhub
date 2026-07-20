import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { DirectoryService } from './directory.service'

/**
 * Public, unauthenticated school directory used by the student registration
 * wizard (students browse before they have an account).
 */
@ApiTags('directory')
@Controller('directory')
export class DirectoryController {
  constructor(private readonly directory: DirectoryService) {}

  @Get('meta')
  meta() {
    return this.directory.meta()
  }

  @Get('schools')
  schools(
    @Query('state') state?: string,
    @Query('board') board?: string,
    @Query('q') q?: string,
  ) {
    return this.directory.schools({
      ...(state ? { state } : {}),
      ...(board ? { board } : {}),
      ...(q ? { q } : {}),
    })
  }

  @Get('schools/:id/classes')
  schoolClasses(@Param('id') id: string) {
    return this.directory.schoolClasses(id)
  }

  @Get('join-code/:code')
  lookupJoinCode(@Param('code') code: string) {
    return this.directory.lookupJoinCode(code)
  }
}
