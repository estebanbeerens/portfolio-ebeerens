import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full name shown on the portfolio',
    example: 'Jane Doe',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Short professional headline',
    example: 'Full-stack developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({ description: 'Longer biography text' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL of the profile avatar image',
    example: 'https://cdn.example.com/avatar.png',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
