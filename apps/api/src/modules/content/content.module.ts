import { Module } from '@nestjs/common'

import { AuditModule } from '../audit/audit.module'
import { StorageModule } from '../storage/storage.module'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
