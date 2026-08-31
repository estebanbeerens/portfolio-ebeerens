import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationDto } from '../../organizations/dto/organization.dto';
import { SkillDto } from '../../skills/dto/skill.dto';
import { EmploymentType } from '../../../generated/prisma/enums';

export class RoleDto {
  @ApiProperty({
    description: 'Unique identifier of the role',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  id: string;

  @ApiProperty({ example: 'Senior Frontend Engineer' })
  jobTitle: string;

  @ApiProperty({
    description: 'The organization this role was held at',
    type: OrganizationDto,
  })
  organization: OrganizationDto;

  @ApiPropertyOptional({
    description: 'Markdown source describing responsibilities and achievements in this role (English)',
    example: 'Built **accessible** Angular interfaces and mentored frontend engineers.',
  })
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Markdown source describing responsibilities and achievements in this role (Dutch)',
    example: 'Bouwde **toegankelijke** Angular interfaces en begeleidde frontend engineers.',
  })
  descriptionNl?: string;

  @ApiPropertyOptional({ example: 'Amsterdam, Netherlands' })
  location?: string | null;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  employmentType?: EmploymentType | null;

  @ApiProperty({
    description: 'When this role started',
    example: '2024-01-15T00:00:00.000Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'When this role ended \u2014 absent means still current',
    example: '2024-06-30T00:00:00.000Z',
  })
  endDate?: Date | null;

  @ApiProperty({ description: 'Skills used in this role', type: [SkillDto] })
  skills: SkillDto[];

  @ApiProperty({ example: '2026-08-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-17T12:00:00.000Z' })
  updatedAt: Date;
}
