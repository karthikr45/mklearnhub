import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'

export const CONTENT_TYPES = [
  'RICH_TEXT', 'HTML', 'PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DIAGRAM', 'ANIMATION',
  'INTERACTIVE', 'DETAILED_NOTES', 'REVISION_NOTES', 'FORMULA_SHEET',
  'KEY_CONCEPTS', 'FLASHCARDS', 'WORKED_EXAMPLES', 'MCQ', 'MULTI_SELECT',
  'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL', 'ASSERTION_REASON', 'COMPETENCY',
  'CASE_STUDY', 'WORKSHEET', 'TOPIC_QUIZ', 'CHAPTER_TEST', 'SUBJECT_TEST',
  'MOCK_EXAM', 'SOLUTION', 'PREVIOUS_PAPER', 'OFFICIAL_EXTERNAL',
]
export const SOURCE_TYPES = [
  'ORIGINAL', 'OPEN_LICENSE', 'LICENSED', 'OFFICIAL_EXTERNAL', 'USER_UPLOADED',
  'INTERNAL_GENERATED',
]
export const LICENSE_TYPES = [
  'OWNED', 'CC0', 'CC_BY', 'CC_BY_SA', 'COMMERCIAL_LICENSE', 'EXTERNAL_ONLY',
  'CUSTOM', 'UNKNOWN',
]
export const NODE_TYPES = ['SUBJECT', 'UNIT', 'BOOK', 'CHAPTER', 'TOPIC', 'SUBTOPIC', 'OBJECTIVE']
export const SECTIONS = ['LEARN', 'STUDY', 'PRACTICE', 'TEST', 'OFFICIAL']

/** License/provenance fields shared by upload + external/inline creation. */
class LicenseFieldsDto {
  @ApiProperty({ enum: SOURCE_TYPES })
  @IsIn(SOURCE_TYPES)
  sourceType!: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) copyrightOwner?: string
  @ApiPropertyOptional({ enum: LICENSE_TYPES }) @IsOptional() @IsIn(LICENSE_TYPES) licenseType?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) sourceName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsString() licenseUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() commercialUseAllowed?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() redistributionAllowed?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() selfHostingAllowed?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() modificationAllowed?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() attributionRequired?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() attributionText?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() licenseVerified?: boolean
}

export class RequestUploadDto extends LicenseFieldsDto {
  @ApiProperty() @IsString() @MaxLength(300) title!: string
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiProperty({ enum: CONTENT_TYPES }) @IsIn(CONTENT_TYPES) contentType!: string
  @ApiProperty() @IsString() @MaxLength(300) filename!: string
  @ApiProperty() @IsString() @MaxLength(200) mimeType!: string
}

export class CompleteUploadDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) fileSize?: number
  @ApiPropertyOptional() @IsOptional() @IsString() checksum?: string
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string
}

/** For non-file assets: an inline rich-text/MCQ body, or an external reference. */
export class CreateContentDto extends LicenseFieldsDto {
  @ApiProperty() @IsString() @MaxLength(300) title!: string
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiProperty({ enum: CONTENT_TYPES }) @IsIn(CONTENT_TYPES) contentType!: string
  @ApiPropertyOptional() @IsOptional() @IsObject() body?: Record<string, unknown>
}

export class CreateMappingDto {
  @ApiProperty({ enum: NODE_TYPES }) @IsIn(NODE_TYPES) nodeType!: string
  @ApiProperty() @IsString() nodeId!: string
  @ApiProperty({ enum: SECTIONS }) @IsIn(SECTIONS) section!: string
  @ApiProperty() @IsString() @MaxLength(60) role!: string
}
