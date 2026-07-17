import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

export class TimetableSlotDto {
  @ApiProperty({ description: '0 (Sunday) - 6 (Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number

  @ApiProperty({ description: 'HH:mm' })
  @IsString()
  startTime!: string

  @ApiProperty({ description: 'HH:mm' })
  @IsString()
  endTime!: string

  @ApiProperty()
  @IsString()
  subject!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructorId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  room?: string
}

export class CreateTimetableDto {
  @ApiProperty({ type: [TimetableSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimetableSlotDto)
  slots!: TimetableSlotDto[]
}
