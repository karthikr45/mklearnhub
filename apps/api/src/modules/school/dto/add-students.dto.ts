import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator'

export class AddStudentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds!: string[]
}
