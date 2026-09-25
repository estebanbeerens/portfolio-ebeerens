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
import { CreateEducationDto } from './dto/create-education.dto';
import { EducationDto } from './dto/education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { EducationService } from './education.service';

@ApiTags('education')
@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}
  @Get() @ApiOkResponse({ type: [EducationDto] }) findAll() {
    return this.educationService.findAll();
  }
  @Get(':id') @ApiOkResponse({ type: EducationDto }) @ApiNotFoundResponse() findOne(@Param('id') id: string) {
    return this.educationService.findOne(id);
  }
  @Post() @UseGuards(SessionAuthGuard) @ApiCreatedResponse({ type: EducationDto }) @ApiUnauthorizedResponse() create(
    @Body() dto: CreateEducationDto,
    @Req() req: RequestWithGithubUser
  ) {
    return this.educationService.create(dto, actorOf(req));
  }
  @Put(':id') @UseGuards(SessionAuthGuard) @ApiOkResponse({ type: EducationDto }) @ApiNotFoundResponse() update(
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
    @Req() req: RequestWithGithubUser
  ) {
    return this.educationService.update(id, dto, actorOf(req));
  }
  @Delete(':id') @UseGuards(SessionAuthGuard) @HttpCode(HttpStatus.NO_CONTENT) @ApiNoContentResponse() remove(
    @Param('id') id: string,
    @Req() req: RequestWithGithubUser
  ) {
    return this.educationService.remove(id, actorOf(req));
  }
}
