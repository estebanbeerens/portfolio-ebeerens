import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { ProjectDto } from './project.dto';

// Public-facing shape for `/projects/:id/related` and the public-portfolio bundle: a single
// resolved language rather than the admin `*En`/`*Nl` pair.
export class PublicProjectDto extends OmitType(ProjectDto, [
  'shortDescriptionEn',
  'shortDescriptionNl',
  'descriptionEn',
  'descriptionNl',
] as const) {
  @ApiProperty({
    description: 'Short summary shown alongside the project, resolved to the requested language',
    example: 'A fast, accessible portfolio built with Angular and NestJS.',
    maxLength: 255,
  })
  shortDescription: string;

  @ApiProperty({
    description: 'Markdown source for the project description, resolved to the requested language',
    example: '## Overview\n\nBuilt with **Angular** and *NestJS*.',
  })
  description: string;

  @ApiPropertyOptional({ description: 'Sanitized HTML rendered from `description`' })
  descriptionHtml?: string;
}
