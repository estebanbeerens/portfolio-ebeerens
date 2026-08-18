import { ApiProperty } from '@nestjs/swagger';

export class ResumeDto {
  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  fileSize!: number;

  @ApiProperty()
  uploadedAt!: Date;
}
