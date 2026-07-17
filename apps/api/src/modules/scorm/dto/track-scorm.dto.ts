import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

/**
 * A single SCORM RTE (Run-Time Environment) call proxied from the content
 * frame. `action` is the SCORM 1.2 (LMS*) or SCORM 2004 API method name.
 */
export class TrackScormDto {
  @ApiProperty()
  @IsString()
  scoId!: string

  @ApiProperty({
    description:
      'RTE method: Initialize | GetValue | SetValue | Commit | Terminate (or the SCORM 1.2 LMS* variants).',
  })
  @IsString()
  action!: string

  @ApiPropertyOptional({ description: 'CMI data-model element, e.g. cmi.completion_status' })
  @IsOptional()
  @IsString()
  key?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string
}
