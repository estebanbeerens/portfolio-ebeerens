import { ApiProperty } from '@nestjs/swagger';
import { SkillDto } from './skill.dto';

export class SkillCategoryDto {
  @ApiProperty({ example: 'cly1x8f9z0000abcd1234efgh' })
  id: string;

  @ApiProperty({ example: 'Frontend' })
  name: string;

  @ApiProperty({ type: [SkillDto] })
  skills: SkillDto[];

  @ApiProperty({ example: '2026-10-12T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-12T00:00:00.000Z' })
  updatedAt: Date;
}
