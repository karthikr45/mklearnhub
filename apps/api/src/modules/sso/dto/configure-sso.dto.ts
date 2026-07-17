import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SsoProvider, UserRole } from '@learnhub/db'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator'

export class SsoAttributeMapDto {
  @ApiProperty()
  @IsString()
  email!: string

  @ApiProperty()
  @IsString()
  firstName!: string

  @ApiProperty()
  @IsString()
  lastName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string
}

export class ConfigureSsoDto {
  @ApiProperty({ enum: SsoProvider })
  @IsEnum(SsoProvider)
  provider!: SsoProvider

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  metadataUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metadataXml?: string

  @ApiProperty({ type: SsoAttributeMapDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SsoAttributeMapDto)
  attributeMap!: SsoAttributeMapDto

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.LEARNER })
  @IsOptional()
  @IsEnum(UserRole)
  defaultRole: UserRole = UserRole.LEARNER

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoProvision = true
}
