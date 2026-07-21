import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator'

export class PushKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh!: string

  @IsString()
  @IsNotEmpty()
  auth!: string
}

export class SubscribeDto {
  @IsUrl({ require_tld: false })
  endpoint!: string

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto
}

export class UnsubscribeDto {
  @IsUrl({ require_tld: false })
  endpoint!: string
}
