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
    description: 'Short summary shown alongside the project (English)',
    example: 'A fast, accessible portfolio built with Angular and NestJS.',
    maxLength: 255,
  })
  shortDescriptionEn: string;

  @ApiPropertyOptional({
    description: 'Short summary shown alongside the project (Dutch)',
    example: 'Een snelle, toegankelijke portfolio gebouwd met Angular en NestJS.',
    maxLength: 255,
  })
  shortDescriptionNl?: string;

  @ApiProperty({
    description: 'Markdown source for the project description, as authored in admin (English)',
    example: '## Overview\n\nBuilt with **Angular** and *NestJS*.',
  })
  descriptionEn: string;

  @ApiPropertyOptional({
    description: 'Markdown source for the project description, as authored in admin (Dutch)',
    example: '## Overzicht\n\nGebouwd met **Angular** en *NestJS*.',
  })
  descriptionNl?: string;

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
    description: 'When work on the project ended \u2014 absent means still ongoing',
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
