import { Module } from '@nestjs/common'

import { ModerationService } from './moderation.service'
import { StudyGroupsController } from './study-groups.controller'
import { StudyGroupsService } from './study-groups.service'

@Module({
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService, ModerationService],
  exports: [ModerationService],
})
export class StudyGroupsModule {}
