import { Module } from '@nestjs/common'

import { ScormController } from './scorm.controller'
import { ScormService } from './scorm.service'
import { XapiController } from './xapi.controller'

@Module({
  controllers: [ScormController, XapiController],
  providers: [ScormService],
  exports: [ScormService],
})
export class ScormModule {}
