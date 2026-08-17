import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationDto {
  @ApiProperty({
    description: 'Unique identifier of the organization',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logos/acme.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://acme.example.com' })
  website?: string | null;

  @ApiProperty({ example: '2026-08-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-17T12:00:00.000Z' })
  updatedAt: Date;
}
