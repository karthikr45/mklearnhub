import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Prisma } from '@learnhub/db'
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  userId!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  type!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Prisma.InputJsonValue
}
