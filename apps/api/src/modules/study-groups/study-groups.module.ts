import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { ModerationService } from './moderation.service'
import { StudyGateway } from './study.gateway'
import { StudyGroupsController } from './study-groups.controller'
import { StudyGroupsService } from './study-groups.service'

@Module({
  imports: [JwtModule.register({})],
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService, ModerationService, StudyGateway],
  exports: [ModerationService],
})
export class StudyGroupsModule {}
