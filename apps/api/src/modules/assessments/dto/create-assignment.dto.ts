import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string

  @ApiPropertyOptional({ description: 'ISO-8601 due date' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxScore?: number
}
