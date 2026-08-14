import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({
    description: 'Unique identifier of the project',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  id: string;

  @ApiProperty({ example: 'Personal Portfolio' })
  title: string;

  @ApiProperty({
    description: 'URL-safe unique identifier',
    example: 'personal-portfolio',
  })
  slug: string;

  @ApiProperty({
    description:
      'ProseMirror JSON document \u2014 see the image-storage-r2 skill for how this is produced/rendered',
    type: Object,
    example: { type: 'doc', content: [] },
  })
  description: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/projects/portfolio.png',
  })
  imageUrl?: string | null;

  @ApiProperty({ example: '2026-08-14T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-14T12:00:00.000Z' })
  updatedAt: Date;
}
