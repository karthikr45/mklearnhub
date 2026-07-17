import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '@learnhub/db'
import { IsEmail, IsEnum } from 'class-validator'

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole
}
