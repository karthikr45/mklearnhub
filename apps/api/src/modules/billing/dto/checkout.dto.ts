import { ApiProperty } from '@nestjs/swagger'
import { Plan } from '@learnhub/db'
import { IsEnum } from 'class-validator'

export class CheckoutDto {
  @ApiProperty({ enum: Plan })
  @IsEnum(Plan)
  plan!: Plan
}
