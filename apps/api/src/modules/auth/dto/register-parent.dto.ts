import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Matches, MinLength } from 'class-validator'

/**
 * Parent self-registration via a child's link code. The code binds the new
 * PARENT to exactly one student, so a parent never browses a list of minors.
 */
export class RegisterParentDto {
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

  @ApiProperty({ description: "The child's parent-link code" })
  @IsString()
  @MinLength(4)
  code!: string
}
