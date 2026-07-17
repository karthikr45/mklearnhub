import { Module } from '@nestjs/common'

import { HrmsController } from './hrms.controller'
import { HrmsService } from './hrms.service'

@Module({
  controllers: [HrmsController],
  providers: [HrmsService],
  exports: [HrmsService],
})
export class HrmsModule {}
