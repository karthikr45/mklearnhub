import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

export class VideoUploadUrlDto {
  @ApiProperty()
  @IsString()
  @MaxLength(300)
  filename!: string

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  contentType!: string
}

export class AttachKeyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  key!: string
}
