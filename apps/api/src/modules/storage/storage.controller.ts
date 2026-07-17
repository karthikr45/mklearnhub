import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PresignUploadDto } from './dto/presign-upload.dto'
import { StorageService } from './storage.service'

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign-upload')
  presignUpload(@Body() dto: PresignUploadDto) {
    return this.storage.getPresignedUploadUrl(
      dto.key,
      dto.contentType,
      dto.maxSize,
    )
  }
}
