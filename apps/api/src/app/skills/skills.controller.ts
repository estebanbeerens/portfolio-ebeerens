import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AssignSkillCategoryDto } from './dto/assign-skill-category.dto';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { SkillCategoryDto } from './dto/skill-category.dto';
import { SkillDto } from './dto/skill.dto';
import { SkillManagementDto } from './dto/skill-management.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';
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

  @Get('admin')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Skills grouped by category for admin management', type: SkillManagementDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  findManagement(): Promise<SkillManagementDto> {
    return this.skillsService.findManagement();
  }

  @Post('categories')
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'The created skill category', type: SkillCategoryDto })
  @ApiConflictResponse({ description: 'A skill category with this name already exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  createCategory(@Body() dto: CreateSkillCategoryDto): Promise<SkillCategoryDto> {
    return this.skillsService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'The updated skill category', type: SkillCategoryDto })
  @ApiConflictResponse({ description: 'A skill category with this name already exists' })
  @ApiNotFoundResponse({ description: 'No skill category with this id exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateSkillCategoryDto): Promise<SkillCategoryDto> {
    return this.skillsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The skill category was deleted and its skills are now unassigned' })
  @ApiNotFoundResponse({ description: 'No skill category with this id exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  removeCategory(@Param('id') id: string): Promise<void> {
    return this.skillsService.removeCategory(id);
  }

  @Put(':id/category')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'The updated skill', type: SkillDto })
  @ApiNotFoundResponse({ description: 'No skill or category with this id exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  setCategory(@Param('id') id: string, @Body() dto: AssignSkillCategoryDto): Promise<SkillDto> {
    return this.skillsService.setCategory(id, dto);
  }
}
