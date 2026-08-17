import { ApiProperty } from '@nestjs/swagger';

export class SkillDto {
  @ApiProperty({
    description: 'Unique identifier of the skill',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  id: string;

  @ApiProperty({ example: 'Angular' })
  name: string;
}
