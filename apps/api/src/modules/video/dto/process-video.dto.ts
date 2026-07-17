import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ProcessVideoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  s3Key!: string
}
