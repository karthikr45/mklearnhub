import { ApiPropertyOptional } from '@nestjs/swagger'
import type { Prisma } from '@learnhub/db'
import { IsArray, IsOptional, IsString } from 'class-validator'

export class SubmitAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: 'Array of attachment descriptors' })
  @IsOptional()
  @IsArray()
  attachments?: Prisma.InputJsonValue
}
