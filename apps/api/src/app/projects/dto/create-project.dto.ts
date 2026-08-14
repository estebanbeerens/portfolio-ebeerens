import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
}
