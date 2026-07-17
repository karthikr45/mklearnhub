import { ApiPropertyOptional } from '@nestjs/swagger'
import type { Prisma } from '@learnhub/db'
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string

  @ApiPropertyOptional({ description: 'Rich-text/JSON document body' })
  @IsOptional()
  content?: Prisma.InputJsonValue

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
