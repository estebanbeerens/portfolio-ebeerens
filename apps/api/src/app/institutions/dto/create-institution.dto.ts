import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'University of Amsterdam' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logos/uva.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'institutions/uuid.png' })
  @IsOptional()
  @IsString()
  logoObjectKey?: string;

  @ApiPropertyOptional({ example: 'https://www.uva.nl' })
  @IsOptional()
  @IsUrl()
  website?: string;
}
