import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Prisma } from '@learnhub/db'
import { IsArray, IsDefined, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiProperty({ description: 'Rich-text/JSON document body' })
  @IsDefined()
  content!: Prisma.InputJsonValue

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
