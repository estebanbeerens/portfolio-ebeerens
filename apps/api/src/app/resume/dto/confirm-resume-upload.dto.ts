import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';
import { RESUME_MAX_BYTES, RESUME_MIME_TYPE } from './create-resume-upload-url.dto';

export class ConfirmResumeUploadDto {
  @ApiProperty()
  @IsString()
  objectKey!: string;

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
