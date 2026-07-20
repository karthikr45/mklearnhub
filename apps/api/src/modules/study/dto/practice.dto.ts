import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  Allow,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

const TRACKS = [
  'BOARD_SSC', 'BOARD_INTER', 'JEE_MAIN', 'JEE_ADVANCED', 'NEET',
  'EAPCET_ENGINEERING', 'EAPCET_AGRI_MEDICAL', 'FOUNDATION',
]

export class StartPracticeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chapterId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string

  @ApiPropertyOptional({ enum: TRACKS })
  @IsOptional()
  @IsIn(TRACKS)
  examTrack?: string

  @ApiPropertyOptional({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: string

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number
}

export class AttemptAnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string

  // A response may be a string (MCQ id), string[] (MSQ), number (numeric) or
  // boolean (true/false); validated against the question type at grading time.
  // @Allow lets it pass the global whitelisting ValidationPipe untouched.
  @ApiProperty()
  @Allow()
  response!: unknown
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [AttemptAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttemptAnswerDto)
  responses!: AttemptAnswerDto[]
}
