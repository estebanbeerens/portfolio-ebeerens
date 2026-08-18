import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export const RESUME_MIME_TYPE = 'application/pdf';
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export class CreateResumeUploadUrlDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty({ enum: [RESUME_MIME_TYPE] })
  @Matches(/^application\/pdf$/)
  mimeType!: string;

  @ApiProperty({ maximum: RESUME_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(RESUME_MAX_BYTES)
  fileSize!: number;
}
