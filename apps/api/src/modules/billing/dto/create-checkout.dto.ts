import { ApiProperty } from '@nestjs/swagger'
import { Plan } from '@learnhub/db'
import { IsEnum, IsString, MinLength } from 'class-validator'

export class CreateCheckoutDto {
  @ApiProperty({ enum: Plan })
  @IsEnum(Plan)
  plan!: Plan

  @ApiProperty()
  @IsString()
  @MinLength(1)
  returnUrl!: string
}
