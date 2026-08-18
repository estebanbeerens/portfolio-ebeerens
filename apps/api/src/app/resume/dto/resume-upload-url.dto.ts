import { ApiProperty } from '@nestjs/swagger';

export class ResumeUploadUrlDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  objectKey!: string;
}
