import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateDoubtDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title!: string

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  body!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string
}

export class AnswerDoubtDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string
}
