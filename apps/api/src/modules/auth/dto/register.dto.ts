import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'

const ORG_TYPES = ['BUSINESS', 'SCHOOL', 'INSTITUTE', 'COACHING_CENTER']

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a number' })
  password!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string

  @ApiPropertyOptional({ description: 'Create a new organization with this name' })
  @IsOptional()
  @IsString()
  orgName?: string

  @ApiPropertyOptional({ enum: ORG_TYPES, description: 'Type of the new organization' })
  @IsOptional()
  @IsIn(ORG_TYPES)
  orgType?: string

  @ApiPropertyOptional({ description: 'Accept an org invite by token' })
  @IsOptional()
  @IsString()
  inviteToken?: string
}
