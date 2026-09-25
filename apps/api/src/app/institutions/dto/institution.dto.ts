import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstitutionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'University of Amsterdam' })
  name: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
