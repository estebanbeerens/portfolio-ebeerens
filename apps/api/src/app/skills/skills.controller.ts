import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkillDto } from './dto/skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOkResponse({
    description: 'All skills used across projects',
    type: [SkillDto],
  })
  findAll() {
    return this.skillsService.findAll();
  }
}
