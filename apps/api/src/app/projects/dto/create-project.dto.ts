import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Personal Portfolio' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'URL-safe unique identifier',
    example: 'personal-portfolio',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and hyphen-separated',
  })
  slug: string;

  @ApiProperty({
    description: 'Short summary shown alongside the project',
    example: 'A fast, accessible portfolio built with Angular and NestJS.',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  shortDescription: string;

  @ApiProperty({
    description: 'Markdown source for the project description, rendered client-side with ngx-markdown',
    example: '## Overview\n\nBuilt with **Angular** and *NestJS*.',
  })
  @IsString()
  @MaxLength(20000)
  description: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/projects/portfolio.png',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  client?: string;

  @ApiPropertyOptional({ example: 'Lead Frontend Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobRole?: string;

  @ApiPropertyOptional({ example: 'https://portfolio.example.com' })
  @IsOptional()
  @IsUrl()
  liveUrl?: string;

  @ApiProperty({
    description: 'When work on the project started',
    example: '2024-01-15',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'When work on the project ended \u2014 omit if still ongoing',
    example: '2024-06-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'Skill names used on this project (e.g. React, Angular, .NET, Figma) \u2014 created if they do not already exist',
    example: ['Angular', 'NestJS', 'Figma'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Transform(({ value }: { value?: unknown[] }) =>
    Array.isArray(value) ? value.map((skill) => String(skill).trim().toLowerCase()) : value
  )
  skills?: string[];
}
