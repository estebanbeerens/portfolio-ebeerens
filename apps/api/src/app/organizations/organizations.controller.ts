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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationDto } from './dto/organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOkResponse({ description: 'All organizations', type: [OrganizationDto] })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'The requested organization',
    type: OrganizationDto,
  })
  @ApiNotFoundResponse({ description: 'No organization with this id exists' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({
    description: 'The created organization',
    type: OrganizationDto,
  })
  @ApiConflictResponse({
    description: 'An organization with this name already exists',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  create(@Body() dto: CreateOrganizationDto, @Req() req: RequestWithGithubUser) {
    return this.organizationsService.create(dto, actorOf(req));
  }

  @Put(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({
    description: 'The updated organization',
    type: OrganizationDto,
  })
  @ApiNotFoundResponse({ description: 'No organization with this id exists' })
  @ApiConflictResponse({
    description: 'An organization with this name already exists',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto, @Req() req: RequestWithGithubUser) {
    return this.organizationsService.update(id, dto, actorOf(req));
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The organization was deleted' })
  @ApiNotFoundResponse({ description: 'No organization with this id exists' })
  @ApiConflictResponse({
    description: 'The organization still has roles referencing it',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  remove(@Param('id') id: string, @Req() req: RequestWithGithubUser) {
    return this.organizationsService.remove(id, actorOf(req));
  }
}
