import { Module } from '@nestjs/common'

import { CurriculumService } from './curriculum.service'
import { PracticeService } from './practice.service'
import { ProgressService } from './progress.service'
import { StudyController } from './study.controller'

@Module({
  controllers: [StudyController],
  providers: [CurriculumService, PracticeService, ProgressService],
})
export class StudyModule {}
