import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class AnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds!: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[]
}
