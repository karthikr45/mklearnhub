import { ApiProperty } from '@nestjs/swagger'
import { Plan } from '@learnhub/db'
import { IsEnum, IsString } from 'class-validator'

export class VerifyDto {
  @ApiProperty({ enum: Plan })
  @IsEnum(Plan)
  plan!: Plan

  @ApiProperty()
  @IsString()
  razorpay_order_id!: string

  @ApiProperty()
  @IsString()
  razorpay_payment_id!: string

  @ApiProperty()
  @IsString()
  razorpay_signature!: string
}
