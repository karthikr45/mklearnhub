import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class JoinClassDto {
  @ApiProperty({ description: 'The class join code shared by the school' })
  @IsString()
  @MinLength(4)
  code!: string
}
