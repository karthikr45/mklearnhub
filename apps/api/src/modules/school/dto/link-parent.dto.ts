import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class LinkParentDto {
  @ApiProperty()
  @IsString()
  studentId!: string

  @ApiPropertyOptional({ default: 'parent' })
  @IsOptional()
  @IsString()
  relation?: string
}
