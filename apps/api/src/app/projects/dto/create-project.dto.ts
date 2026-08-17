import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

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
    description:
      'ProseMirror JSON document \u2014 see the image-storage-r2 skill for how this is produced/rendered',
    type: Object,
  })
  @IsObject()
  description: Record<string, unknown>;

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
  skills?: string[];
}
