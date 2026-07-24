import { Module } from '@nestjs/common'

import { AuditModule } from '../audit/audit.module'
import { StorageModule } from '../storage/storage.module'
import { CurriculumAdminService } from './curriculum-admin.service'
import { CurriculumController } from './curriculum.controller'
import { CurriculumImportService } from './curriculum-import.service'
import { CurriculumQuestionsService } from './curriculum-questions.service'
import { CurriculumService } from './curriculum.service'

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [CurriculumController],
  providers: [
    CurriculumService,
    CurriculumImportService,
    CurriculumAdminService,
    CurriculumQuestionsService,
  ],
  exports: [CurriculumService],
})
export class CurriculumModule {}
