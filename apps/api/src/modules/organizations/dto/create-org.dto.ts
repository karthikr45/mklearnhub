import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { OrgType } from '@learnhub/db'
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string

  @ApiPropertyOptional({ enum: OrgType })
  @IsOptional()
  @IsEnum(OrgType)
  type?: OrgType
}
