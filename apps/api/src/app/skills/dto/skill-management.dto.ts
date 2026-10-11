import { ApiProperty } from '@nestjs/swagger';
import { SkillDto } from './skill.dto';
import { SkillCategoryDto } from './skill-category.dto';

export class SkillManagementDto {
  @ApiProperty({ type: [SkillCategoryDto] })
  categories: SkillCategoryDto[];

  @ApiProperty({ type: [SkillDto] })
  unassignedSkills: SkillDto[];
}
