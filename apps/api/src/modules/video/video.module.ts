import { Module } from '@nestjs/common'

import { StorageModule } from '../storage/storage.module'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'

@Module({
  imports: [StorageModule],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
