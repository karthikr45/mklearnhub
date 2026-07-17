import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator'

export class RecordGradeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  subject!: string

  @ApiProperty()
  @IsNumber()
  @Min(0)
  score!: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxScore!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLabel?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  term?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string
}
