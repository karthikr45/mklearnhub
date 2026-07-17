import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const FONT_FAMILIES = ['Inter', 'Poppins', 'DM Sans', 'Lato', 'Nunito'] as const

export class SaveBrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appName?: string

  @ApiPropertyOptional({ example: '#6366F1' })
  @IsOptional()
  @Matches(HEX_COLOR, { message: 'primaryColor must be a #RRGGBB hex colour' })
  primaryColor?: string

  @ApiPropertyOptional({ example: '#0EA5E9' })
  @IsOptional()
  @Matches(HEX_COLOR, { message: 'secondaryColor must be a #RRGGBB hex colour' })
  secondaryColor?: string

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @Matches(HEX_COLOR, { message: 'accentColor must be a #RRGGBB hex colour' })
  accentColor?: string

  @ApiPropertyOptional({ enum: FONT_FAMILIES })
  @IsOptional()
  @IsIn(FONT_FAMILIES)
  fontFamily?: (typeof FONT_FAMILIES)[number]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customCss?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customDomain?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerText?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  supportEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hideLearnhubBranding?: boolean
}

/** Payload for POST /branding/assets (local JSON mode). */
export class BrandingAssetDto {
  @ApiPropertyOptional({ enum: ['logo', 'logoDark', 'favicon', 'loginBg'] })
  @IsString()
  @IsIn(['logo', 'logoDark', 'favicon', 'loginBg'])
  type!: 'logo' | 'logoDark' | 'favicon' | 'loginBg'

  @ApiPropertyOptional()
  @IsString()
  url!: string
}
