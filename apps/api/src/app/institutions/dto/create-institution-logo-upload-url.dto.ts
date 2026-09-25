import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export const INSTITUTION_LOGO_MIME_PATTERN = /^image\/(png|jpeg|webp)$/;
export const INSTITUTION_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export class CreateInstitutionLogoUploadUrlDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'image/webp'] })
  @Matches(INSTITUTION_LOGO_MIME_PATTERN)
  mimeType!: string;

  @ApiProperty({ maximum: INSTITUTION_LOGO_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(INSTITUTION_LOGO_MAX_BYTES)
  fileSize!: number;
}
