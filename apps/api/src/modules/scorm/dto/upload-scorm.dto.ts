import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { ScormVersion } from '@learnhub/db'

export class UploadScormDto {
  @ApiProperty()
  @IsString()
  title!: string

  @ApiPropertyOptional({
    description: 'S3 key of the pre-uploaded .zip. Omitted in local mode.',
  })
  @IsOptional()
  @IsString()
  s3Key?: string

  @ApiPropertyOptional({ enum: ScormVersion })
  @IsOptional()
  @IsEnum(ScormVersion)
  version?: ScormVersion
}
