import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CvRequestDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  consentedAt: Date;

  @ApiProperty()
  consentTextVersion: string;
}

export class CvRequestPageDto {
  @ApiProperty({ type: [CvRequestDto] })
  items: CvRequestDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  offset: number;
}
