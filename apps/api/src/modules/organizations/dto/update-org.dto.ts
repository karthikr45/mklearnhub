import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator'

const BOARDS = [
  'TELANGANA_STATE', 'ANDHRA_PRADESH_STATE',
  'TELANGANA_INTERMEDIATE', 'ANDHRA_PRADESH_INTERMEDIATE',
  'CBSE', 'ICSE', 'IB', 'NIOS', 'OTHER',
]
const STATES = ['TELANGANA', 'ANDHRA_PRADESH']

export class UpdateOrgDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string

  // ── School directory profile ──
  @ApiPropertyOptional({ enum: BOARDS })
  @IsOptional()
  @IsIn(BOARDS)
  board?: string

  @ApiPropertyOptional({ enum: STATES })
  @IsOptional()
  @IsIn(STATES)
  state?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string

  @ApiPropertyOptional({ description: 'List this school in the public directory' })
  @IsOptional()
  @IsBoolean()
  listedInDirectory?: boolean
}
