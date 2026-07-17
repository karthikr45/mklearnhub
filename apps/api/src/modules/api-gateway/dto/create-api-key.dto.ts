import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  name!: string

  @ApiProperty({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  scopes: string[] = []

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  rateLimit?: number

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIps?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
