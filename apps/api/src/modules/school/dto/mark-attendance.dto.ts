import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AttendanceStatus } from '@learnhub/db'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class AttendanceEntryDto {
  @ApiProperty()
  @IsString()
  userId!: string

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'ISO date (YYYY-MM-DD)' })
  @IsString()
  date!: string

  @ApiProperty({ type: [AttendanceEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  records!: AttendanceEntryDto[]
}
