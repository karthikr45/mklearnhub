import { Module } from '@nestjs/common'

import { CurriculumService } from './curriculum.service'
import { PracticeService } from './practice.service'
import { StudyController } from './study.controller'

@Module({
  controllers: [StudyController],
  providers: [CurriculumService, PracticeService],
})
export class StudyModule {}
