import { Module } from '@nestjs/common'

import { CurriculumController } from './curriculum.controller'
import { CurriculumImportService } from './curriculum-import.service'
import { CurriculumService } from './curriculum.service'

@Module({
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumImportService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
