import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EmploymentType } from '../../../generated/prisma/enums';

export class CreateRoleDto {
  @ApiProperty({ example: 'Senior Frontend Engineer' })
  @IsString()
  @MaxLength(200)
  jobTitle: string;

  @ApiProperty({
    description: 'Id of the organization this role was held at',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'Markdown source describing responsibilities and achievements in this role (English)',
    example: 'Built **accessible** Angular interfaces and mentored frontend engineers.',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Markdown source describing responsibilities and achievements in this role (Dutch)',
    example: 'Bouwde **toegankelijke** Angular interfaces en begeleidde frontend engineers.',
  })
  @IsOptional()
  @IsString()
  descriptionNl?: string;

  @ApiPropertyOptional({ example: 'Amsterdam, Netherlands' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiProperty({
    description: 'When this role started',
    example: '2024-01-15',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'When this role ended \u2014 omit if still current',
    example: '2024-06-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'Skill names used in this role (e.g. React, Angular, .NET, Figma) \u2014 created if they do not already exist',
    example: ['Angular', 'NestJS', 'Figma'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skills?: string[];
}
