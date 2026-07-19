import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PortalType } from '@learnhub/db'
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

export class CreatePortalDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string

  @ApiPropertyOptional({ enum: PortalType })
  @IsOptional()
  @IsEnum(PortalType)
  type?: PortalType
}
