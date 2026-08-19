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
  headline?: string;

  @ApiPropertyOptional({ description: 'Longer biography text' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL of the profile avatar image',
    example: 'https://cdn.example.com/avatar.png',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Residence location shown on the portfolio',
    example: 'Amsterdam, Netherlands',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://www.linkedin.com/in/jane-doe',
  })
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'GitHub profile URL', example: 'https://github.com/jane-doe' })
  githubUrl?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://www.instagram.com/jane-doe',
  })
  instagramUrl?: string;

  @ApiPropertyOptional({ description: 'X profile URL', example: 'https://x.com/jane-doe' })
  xUrl?: string;

  @ApiPropertyOptional({
    description: 'YouTube channel URL',
    example: 'https://www.youtube.com/@jane-doe',
  })
  youtubeUrl?: string;

  @ApiProperty({
    description: 'Timestamp of the last update',
    example: '2026-08-14T12:00:00.000Z',
  })
  updatedAt: Date;
}
