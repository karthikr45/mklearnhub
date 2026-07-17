import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class AuditQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string

  @ApiPropertyOptional({ enum: ['success', 'failure'] })
  @IsOptional()
  @IsIn(['success', 'failure'])
  status?: 'success' | 'failure'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number
}
