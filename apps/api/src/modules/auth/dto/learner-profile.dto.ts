import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

const TRACKS = ['SCHOOL', 'INTERMEDIATE', 'ENGINEERING', 'MBA', 'OTHER']
const BOARDS = [
  'TELANGANA_STATE',
  'ANDHRA_PRADESH_STATE',
  'TELANGANA_INTERMEDIATE',
  'ANDHRA_PRADESH_INTERMEDIATE',
  'CBSE',
  'ICSE',
  'IB',
  'NIOS',
  'OTHER',
]

/**
 * Self-study learner profile. `track` decides which fields matter: SCHOOL /
 * INTERMEDIATE ask board+class(+stream)+year; ENGINEERING / MBA ask exam
 * targets; OTHER skips academics and uses `interests`.
 */
export class SaveLearnerProfileDto {
  @ApiProperty({ enum: TRACKS })
  @IsIn(TRACKS)
  track!: string

  @ApiPropertyOptional({ enum: BOARDS })
  @IsOptional()
  @IsIn(BOARDS)
  board?: string

  @ApiPropertyOptional({ description: 'Class / grade, e.g. "10" or "1st year"' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  classLevel?: string

  @ApiPropertyOptional({ description: 'Academic year, e.g. "2025-26"' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  year?: string

  @ApiPropertyOptional({ description: 'Intermediate group, e.g. MPC / BiPC' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  stream?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  examTargets?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  interests?: string[]
}
