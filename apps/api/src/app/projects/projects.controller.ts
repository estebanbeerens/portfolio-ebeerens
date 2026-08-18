import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { actorOf, RequestWithGithubUser, SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDto } from './dto/project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({ description: 'All projects', type: [ProjectDto] })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'The requested project', type: ProjectDto })
  @ApiNotFoundResponse({ description: 'No project with this id exists' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'The created project', type: ProjectDto })
  @ApiConflictResponse({
    description: 'A project with this slug already exists',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  create(@Body() dto: CreateProjectDto, @Req() req: RequestWithGithubUser) {
    return this.projectsService.create(dto, actorOf(req));
  }

  @Put(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'The updated project', type: ProjectDto })
  @ApiNotFoundResponse({ description: 'No project with this id exists' })
  @ApiConflictResponse({
    description: 'A project with this slug already exists',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: RequestWithGithubUser) {
    return this.projectsService.update(id, dto, actorOf(req));
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The project was deleted' })
  @ApiNotFoundResponse({ description: 'No project with this id exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  remove(@Param('id') id: string, @Req() req: RequestWithGithubUser) {
    return this.projectsService.remove(id, actorOf(req));
  }
}
