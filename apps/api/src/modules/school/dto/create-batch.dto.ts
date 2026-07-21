import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string

  @ApiPropertyOptional({ description: 'Class/grade, e.g. "Class 10"' })
  @IsOptional()
  @IsString()
  grade?: string

  @ApiPropertyOptional({ description: 'Section, e.g. "A"' })
  @IsOptional()
  @IsString()
  section?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYearId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number
}
