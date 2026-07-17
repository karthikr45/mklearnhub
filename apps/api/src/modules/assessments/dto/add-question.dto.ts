import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { QuestionType } from '@learnhub/db'
import type { Prisma } from '@learnhub/db'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'

export class AddQuestionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  text!: string

  @ApiPropertyOptional({ enum: QuestionType, default: QuestionType.MCQ })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number

  @ApiPropertyOptional({
    description: 'Array of { id, text, isCorrect } option objects',
  })
  @IsOptional()
  @IsArray()
  options?: Prisma.InputJsonValue

  @ApiPropertyOptional({ description: 'Correct answer for text/boolean types' })
  @IsOptional()
  @IsString()
  correctAnswer?: string
}
