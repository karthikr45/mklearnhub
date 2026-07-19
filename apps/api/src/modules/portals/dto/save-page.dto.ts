import { ApiProperty } from '@nestjs/swagger'
import { IsObject } from 'class-validator'

/** The Puck document: `{ root: {...}, content: [...], zones?: {...} }`. */
export class SavePageDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  pageJson!: Record<string, unknown>
}
