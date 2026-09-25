import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionDto } from '../../institutions/dto/institution.dto';

export class EducationDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  degree: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  fieldOfStudy?: string;

  @ApiProperty({ type: InstitutionDto })
  institution: InstitutionDto;

  @ApiPropertyOptional()
  descriptionEn?: string;

  @ApiPropertyOptional()
  descriptionNl?: string;

  @ApiProperty()
  startDate: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
