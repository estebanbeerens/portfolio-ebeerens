import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillDto } from '../../skills/dto/skill.dto';

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

  @ApiPropertyOptional({ example: 'Acme Corp' })
  client?: string | null;

  @ApiPropertyOptional({ example: 'Lead Frontend Engineer' })
  jobRole?: string | null;

  @ApiPropertyOptional({ example: 'https://portfolio.example.com' })
  liveUrl?: string | null;

  @ApiProperty({
    description: 'When work on the project started',
    example: '2024-01-15T00:00:00.000Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description:
      'When work on the project ended \u2014 absent means still ongoing',
    example: '2024-06-30T00:00:00.000Z',
  })
  endDate?: Date | null;

  @ApiProperty({ description: 'Skills used on this project', type: [SkillDto] })
  skills: SkillDto[];

  @ApiProperty({ example: '2026-08-14T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-14T12:00:00.000Z' })
  updatedAt: Date;
}
