import { ApiProperty } from '@nestjs/swagger';

export class OrganizationLogoUploadUrlDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ description: 'Public URL to store as the organization logoUrl once the upload completes' })
  publicUrl!: string;
}
