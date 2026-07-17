import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateChapterDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number
}
