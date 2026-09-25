import { ApiProperty } from '@nestjs/swagger';

export class InstitutionLogoUploadUrlDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty()
  publicUrl!: string;
}
