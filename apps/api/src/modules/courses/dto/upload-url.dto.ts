import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class UploadUrlDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  key!: string
}
