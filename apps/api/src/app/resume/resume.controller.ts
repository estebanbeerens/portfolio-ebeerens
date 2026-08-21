import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { RequestWithGithubUser, SessionAuthGuard } from '../auth/session-auth.guard';
import { ConfirmResumeUploadDto } from './dto/confirm-resume-upload.dto';
import { CreateResumeUploadUrlDto } from './dto/create-resume-upload-url.dto';
import { ResumeUploadUrlDto } from './dto/resume-upload-url.dto';
import { ResumeDto } from './dto/resume.dto';
import { ResumeService } from './resume.service';

@ApiTags('resume')
@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload-url')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'A short-lived presigned PUT url', type: ResumeUploadUrlDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  createUploadUrl(@Body() dto: CreateResumeUploadUrlDto): Promise<ResumeUploadUrlDto> {
    return this.resumeService.createUploadUrl(dto);
  }

  @Put()
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'The stored resume', type: ResumeDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  confirmUpload(@Body() dto: ConfirmResumeUploadDto, @Req() req: RequestWithGithubUser): Promise<ResumeDto> {
    return this.resumeService.confirmUpload(dto, req.displayName ?? req.githubUserId);
  }

  @Get()
  @ApiOkResponse({ description: 'The current resume metadata', type: ResumeDto })
  @ApiNotFoundResponse({ description: 'No resume uploaded yet' })
  findResume(): Promise<ResumeDto> {
    return this.resumeService.findResume();
  }

  @Get('download')
  @ApiNotFoundResponse({ description: 'No resume uploaded yet' })
  async download(@Res() res: Response) {
    const url = await this.resumeService.registerDownload();
    return res.redirect(url);
  }

  @Delete()
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The resume was deleted' })
  @ApiNotFoundResponse({ description: 'No resume uploaded yet' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  remove(@Req() req: RequestWithGithubUser): Promise<void> {
    return this.resumeService.deleteResume(req.displayName ?? req.githubUserId);
  }
}
