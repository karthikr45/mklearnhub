import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { HrmsProvider, UserRole } from '@learnhub/db'
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'

export interface HrmsFieldMapping {
  employeeId: string
  email: string
  firstName: string
  lastName: string
  department?: string
  designation?: string
  branchCode?: string
  managerId?: string
}

export class ConfigureHrmsDto {
  @ApiProperty({ enum: HrmsProvider })
  @IsEnum(HrmsProvider)
  provider!: HrmsProvider

  @ApiProperty({
    description:
      'Maps HRMS payload fields to LearnHub fields (employeeId/email/firstName/lastName/department?/designation?/branchCode?/managerId?)',
  })
  @IsObject()
  fieldMapping!: HrmsFieldMapping

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoDeactivate = true

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.LEARNER })
  @IsOptional()
  @IsEnum(UserRole)
  defaultRole: UserRole = UserRole.LEARNER

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  syncSchedule?: string
}
