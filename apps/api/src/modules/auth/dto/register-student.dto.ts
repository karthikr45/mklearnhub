import { ApiProperty } from '@nestjs/swagger'
import { Equals, IsEmail, IsString, Matches, MinLength } from 'class-validator'

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

  @ApiProperty({ description: 'Must accept the Terms of Service and Privacy Policy' })
  @Equals(true, { message: 'You must accept the Terms and Privacy Policy' })
  termsAccepted!: boolean

  @ApiProperty({
    description: 'A parent/guardian has consented to this registration (DPDP)',
  })
  @Equals(true, { message: 'Parental/guardian consent is required to register' })
  parentalConsent!: boolean
}
