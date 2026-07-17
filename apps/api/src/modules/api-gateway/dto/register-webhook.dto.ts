import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, IsUrl } from 'class-validator'

export class RegisterWebhookDto {
  @ApiProperty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsUrl()
  url!: string

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  events!: string[]
}
