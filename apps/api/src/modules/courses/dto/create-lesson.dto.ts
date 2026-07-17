import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LessonType } from '@learnhub/db'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateLessonDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiPropertyOptional({ enum: LessonType, default: LessonType.VIDEO })
  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFreePreview?: boolean
}
