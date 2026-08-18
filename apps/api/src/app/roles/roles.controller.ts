import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { actorOf, RequestWithGithubUser, SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOkResponse({ description: 'All roles', type: [RoleDto] })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'The requested role', type: RoleDto })
  @ApiNotFoundResponse({ description: 'No role with this id exists' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'The created role', type: RoleDto })
  @ApiNotFoundResponse({ description: 'No organization with this id exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  create(@Body() dto: CreateRoleDto, @Req() req: RequestWithGithubUser) {
    return this.rolesService.create(dto, actorOf(req));
  }

  @Put(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'The updated role', type: RoleDto })
  @ApiNotFoundResponse({
    description: 'No role, or no organization, with this id exists',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: RequestWithGithubUser) {
    return this.rolesService.update(id, dto, actorOf(req));
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The role was deleted' })
  @ApiNotFoundResponse({ description: 'No role with this id exists' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  remove(@Param('id') id: string, @Req() req: RequestWithGithubUser) {
    return this.rolesService.remove(id, actorOf(req));
  }
}
