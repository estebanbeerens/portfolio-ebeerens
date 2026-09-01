import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { actorOf, RequestWithGithubUser, SessionAuthGuard } from '../auth/session-auth.guard';
import { resolveLocale } from '../shared/locale.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectImageUploadUrlDto } from './dto/create-project-image-upload-url.dto';
import { ProjectDto } from './dto/project.dto';
import { ProjectImageUploadUrlDto } from './dto/project-image-upload-url.dto';
import { PublicProjectDto } from './dto/public-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('upload-url')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'A short-lived presigned PUT url for a project image', type: ProjectImageUploadUrlDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  createImageUploadUrl(@Body() dto: CreateProjectImageUploadUrlDto): Promise<ProjectImageUploadUrlDto> {
    return this.projectsService.createImageUploadUrl(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'All projects', type: [ProjectDto] })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id/related')
  @ApiOkResponse({ description: 'Other projects related by shared skills', type: [PublicProjectDto] })
  @ApiNotFoundResponse({ description: 'No project with this id exists' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max related projects to return (default 3)' })
  @ApiHeader({
    name: 'x-accept-language',
    required: false,
    description: 'Requested content language (en/nl); defaults to en',
  })
  @Header('Vary', 'X-Accept-Language')
  findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Headers('x-accept-language') language?: string
  ) {
    return this.projectsService.findRelated(id, limit ? Number(limit) : undefined, resolveLocale(language));
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
