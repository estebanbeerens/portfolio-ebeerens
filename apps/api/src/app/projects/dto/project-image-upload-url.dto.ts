import { ApiProperty } from '@nestjs/swagger';

export class ProjectImageUploadUrlDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ description: 'Public URL to store as the project imageUrl once the upload completes' })
  publicUrl!: string;
}
