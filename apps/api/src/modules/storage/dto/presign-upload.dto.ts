import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'

export class PresignUploadDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  key!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  contentType!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSize?: number
}
