import { Module } from '@nestjs/common'

import { StudyGroupsModule } from '../study-groups/study-groups.module'
import { DoubtsController } from './doubts.controller'
import { DoubtsService } from './doubts.service'

@Module({
  imports: [StudyGroupsModule], // for ModerationService
  controllers: [DoubtsController],
  providers: [DoubtsService],
})
export class DoubtsModule {}
