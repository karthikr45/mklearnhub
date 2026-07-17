import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUrl } from 'class-validator'

export class UpdateOrgDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string
}
