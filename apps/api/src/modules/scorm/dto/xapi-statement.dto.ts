import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'

interface XapiActor {
  mbox?: string
  name?: string
  account?: { name?: string; homePage?: string }
}

interface XapiVerb {
  id: string
  display?: Record<string, string>
}

interface XapiObject {
  id: string
  objectType?: string
  definition?: Record<string, unknown>
}

/**
 * Deliberately permissive xAPI statement shape (Experience API 1.0.3).
 * Only actor/verb/object are structurally required; the service performs the
 * minimal-shape validation and normalisation.
 */
export class XapiStatementDto {
  @ApiProperty()
  @IsObject()
  actor!: XapiActor

  @ApiProperty()
  @IsObject()
  verb!: XapiVerb

  @ApiProperty()
  @IsObject()
  object!: XapiObject

  @ApiPropertyOptional({ description: 'Statement UUID; generated if absent.' })
  @IsOptional()
  @IsString()
  id?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestamp?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  result?: Record<string, unknown>

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>
}
