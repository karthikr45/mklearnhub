import { Global, Module } from '@nestjs/common'

import { AuditController } from './audit.controller'
import { AuditInterceptor } from './audit.interceptor'
import { AuditService } from './audit.service'
import { DataSubjectController } from './data-subject.controller'
import { DataSubjectService } from './data-subject.service'

@Global()
@Module({
  controllers: [AuditController, DataSubjectController],
  providers: [AuditService, DataSubjectService, AuditInterceptor],
  exports: [AuditService, DataSubjectService, AuditInterceptor],
})
export class AuditModule {}
