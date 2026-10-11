import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString, ValidateIf } from 'class-validator';

export class AssignSkillCategoryDto {
  @ApiProperty({
    description: 'The target category id, or null to make the skill unassigned',
    example: 'cly1x8f9z0000abcd1234efgh',
    nullable: true,
  })
  @IsDefined()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  categoryId: string | null;
}
