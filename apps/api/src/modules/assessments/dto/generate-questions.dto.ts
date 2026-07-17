import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'

export class GenerateQuestionsDto {
  @ApiProperty({ description: 'Source content to derive questions from' })
  @IsString()
  @MinLength(1)
  content!: string

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number
}
