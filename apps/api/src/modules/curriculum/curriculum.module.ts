import { Module } from '@nestjs/common'

import { StorageModule } from '../storage/storage.module'
import { CurriculumController } from './curriculum.controller'
import { CurriculumImportService } from './curriculum-import.service'
import { CurriculumService } from './curriculum.service'

@Module({
  imports: [StorageModule],
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumImportService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
