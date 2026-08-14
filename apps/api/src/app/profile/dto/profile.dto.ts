import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({
    description: 'Unique identifier of the profile',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  id: string;

  @ApiProperty({
    description: 'Full name shown on the portfolio',
    example: 'Jane Doe',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Short professional headline',
    example: 'Full-stack developer',
  })
  headline?: string | null;

  @ApiPropertyOptional({ description: 'Longer biography text' })
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'URL of the profile avatar image',
    example: 'https://cdn.example.com/avatar.png',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Timestamp of the last update',
    example: '2026-08-14T12:00:00.000Z',
  })
  updatedAt: Date;
}
