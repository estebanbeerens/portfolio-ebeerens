import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { EducationDto } from './education.dto';

export class PublicEducationDto extends OmitType(EducationDto, ['descriptionEn', 'descriptionNl'] as const) {
  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  descriptionHtml?: string;
}
