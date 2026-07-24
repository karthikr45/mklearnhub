import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

/** Step 1: request a presigned upload URL for a lesson attachment. */
export class AttachmentUploadUrlDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentType!: string
}

/** Step 2: register the uploaded object as an attachment on the lesson. */
export class CreateAttachmentDto {
  @ApiProperty({ description: 'Storage key returned by the upload-url step' })
  @IsString()
  @IsNotEmpty()
  storageKey!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentType!: string

  @ApiPropertyOptional({ description: 'Display title (defaults to file name)' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number
}
