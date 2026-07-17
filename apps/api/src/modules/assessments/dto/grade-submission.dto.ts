import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class GradeSubmissionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  score!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string
}
