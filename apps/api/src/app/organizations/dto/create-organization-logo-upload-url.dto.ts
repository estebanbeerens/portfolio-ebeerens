import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export const ORGANIZATION_LOGO_MIME_PATTERN = /^image\/(png|jpeg|webp)$/;
export const ORGANIZATION_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export class CreateOrganizationLogoUploadUrlDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'image/webp'] })
  @Matches(ORGANIZATION_LOGO_MIME_PATTERN)
  mimeType!: string;

  @ApiProperty({ maximum: ORGANIZATION_LOGO_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(ORGANIZATION_LOGO_MAX_BYTES)
  fileSize!: number;
}
