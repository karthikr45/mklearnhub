import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Matches, MinLength } from 'class-validator'

/**
 * Student self-registration. A student joins a real school by entering the
 * batch join code their teacher shared (Google Classroom style). The code
 * binds them to exactly one school + academic year + class/section, which is
 * what keeps children's study groups limited to verified classmates.
 */
export class RegisterStudentDto {
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

  @ApiProperty({ description: 'Batch join code shared by the school' })
  @IsString()
  @MinLength(4)
  joinCode!: string
}
