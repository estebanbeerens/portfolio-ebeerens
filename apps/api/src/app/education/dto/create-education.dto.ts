import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Bachelor of Science' })
  @IsString()
  @MaxLength(200)
  degree: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fieldOfStudy?: string;

  @ApiProperty({ description: 'Id of the institution attended' })
  @IsString()
  institutionId: string;

  @ApiPropertyOptional({ description: 'Markdown description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Markdown description in Dutch' })
  @IsOptional()
  @IsString()
  descriptionNl?: string;

  @ApiProperty({ example: '2018-09-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2022-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
