import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logos/acme.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'R2 object key returned by the logo presign endpoint, paired with `logoUrl`',
    example: 'organizations/9c3f9b2e-2b8e-4a9b-8f1a-9c3f9b2e2b8e.png',
  })
  @IsOptional()
  @IsString()
  logoObjectKey?: string;

  @ApiPropertyOptional({ example: 'https://acme.example.com' })
  @IsOptional()
  @IsUrl()
  website?: string;
}
