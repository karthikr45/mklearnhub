import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

export class UpdateProgressDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  watchedSecs!: number
}
