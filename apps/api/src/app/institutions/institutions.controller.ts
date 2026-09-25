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
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { CreateInstitutionLogoUploadUrlDto } from './dto/create-institution-logo-upload-url.dto';
import { InstitutionDto } from './dto/institution.dto';
import { InstitutionLogoUploadUrlDto } from './dto/institution-logo-upload-url.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionsService } from './institutions.service';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post('upload-url')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ type: InstitutionLogoUploadUrlDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  createLogoUploadUrl(@Body() dto: CreateInstitutionLogoUploadUrlDto) {
    return this.institutionsService.createLogoUploadUrl(dto);
  }

  @Get()
  @ApiOkResponse({ type: [InstitutionDto] })
  findAll() {
    return this.institutionsService.findAll();
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ type: InstitutionDto })
  @ApiConflictResponse({ description: 'An institution with this name already exists' })
  create(@Body() dto: CreateInstitutionDto, @Req() req: RequestWithGithubUser) {
    return this.institutionsService.create(dto, actorOf(req));
  }

  @Put(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ type: InstitutionDto })
  @ApiNotFoundResponse({ description: 'No institution with this id exists' })
  update(@Param('id') id: string, @Body() dto: UpdateInstitutionDto, @Req() req: RequestWithGithubUser) {
    return this.institutionsService.update(id, dto, actorOf(req));
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: string, @Req() req: RequestWithGithubUser) {
    return this.institutionsService.remove(id, actorOf(req));
  }
}
