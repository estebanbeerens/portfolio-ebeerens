import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export const PROJECT_IMAGE_MIME_PATTERN = /^image\/(png|jpeg|webp)$/;
export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export class CreateProjectImageUploadUrlDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'image/webp'] })
  @Matches(PROJECT_IMAGE_MIME_PATTERN)
  mimeType!: string;

  @ApiProperty({ maximum: PROJECT_IMAGE_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(PROJECT_IMAGE_MAX_BYTES)
  fileSize!: number;
}
