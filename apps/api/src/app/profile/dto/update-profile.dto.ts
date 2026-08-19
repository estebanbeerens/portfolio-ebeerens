import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

const WEB_URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true };

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full name shown on the portfolio',
    example: 'Jane Doe',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Short professional headline',
    example: 'Full-stack developer',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({ description: 'Markdown source for the public biography' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL of the profile avatar image',
    example: 'https://cdn.example.com/avatar.png',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(WEB_URL_OPTIONS)
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Residence location shown on the portfolio', example: 'Amsterdam, Netherlands' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL', example: 'https://www.linkedin.com/in/jane-doe' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(WEB_URL_OPTIONS)
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'GitHub profile URL', example: 'https://github.com/jane-doe' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(WEB_URL_OPTIONS)
  githubUrl?: string;

  @ApiPropertyOptional({ description: 'Instagram profile URL', example: 'https://www.instagram.com/jane-doe' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(WEB_URL_OPTIONS)
  instagramUrl?: string;

  @ApiPropertyOptional({ description: 'X profile URL', example: 'https://x.com/jane-doe' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(WEB_URL_OPTIONS)
  xUrl?: string;

  @ApiPropertyOptional({ description: 'YouTube channel URL', example: 'https://www.youtube.com/@jane-doe' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(WEB_URL_OPTIONS)
  youtubeUrl?: string;
}
