import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class SetVideoUrlDto {
  @ApiProperty({ description: 'mp4 URL, HLS .m3u8 URL, or a YouTube link' })
  @IsString()
  @MinLength(4)
  videoUrl!: string
}
