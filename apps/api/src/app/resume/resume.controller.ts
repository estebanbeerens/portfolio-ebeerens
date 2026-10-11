import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { resolveLocale } from '../shared/locale.util';
import { CvRequestsService } from './cv-requests.service';
import { CvDownloadDto } from './dto/cv-download.dto';
import { CvRequestPageDto } from './dto/cv-request.dto';
import { RequestCvDto } from './dto/request-cv.dto';
import { ResumeService } from './resume.service';

const localeHeader = {
  name: 'x-accept-language',
  required: false,
  description: 'Requested content language (en/nl); defaults to en',
};

@ApiTags('resume')
@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resume: ResumeService,
    private readonly requests: CvRequestsService
  ) {}

  @Get('download')
  @ApiHeader(localeHeader)
  @ApiResponse({ status: 302, description: 'Redirect to the generated CV' })
  @ApiNotFoundResponse({ description: 'CV unavailable' })
  @ApiServiceUnavailableResponse({ description: 'CV generation unavailable' })
  @Header('Cache-Control', 'no-store')
  @Header('Vary', 'X-Accept-Language')
  async download(@Res() response: Response, @Headers('x-accept-language') language?: string) {
    const result = await this.resume.download(resolveLocale(language));
    return response.redirect(result.downloadUrl);
  }

  @Post('download')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(localeHeader)
  @ApiOkResponse({ description: 'A generated CV download URL and optional logging status', type: CvDownloadDto })
  @ApiBadRequestResponse({ description: 'Invalid details, consent or verification' })
  @ApiNotFoundResponse({ description: 'CV unavailable' })
  @ApiServiceUnavailableResponse({ description: 'CV generation unavailable' })
  @Header('Cache-Control', 'no-store')
  requestDownload(@Body() dto: RequestCvDto, @Headers('x-accept-language') language?: string): Promise<CvDownloadDto> {
    return this.resume.download(resolveLocale(language), dto);
  }

  @Post('preview')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiHeader(localeHeader)
  @ApiOkResponse({ description: 'A generated CV preview without download logging', type: CvDownloadDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  @ApiNotFoundResponse({ description: 'CV unavailable' })
  @ApiServiceUnavailableResponse({ description: 'CV generation unavailable' })
  @Header('Cache-Control', 'no-store')
  preview(@Headers('x-accept-language') language?: string): Promise<CvDownloadDto> {
    return this.resume.preview(resolveLocale(language));
  }

  @Get('requests')
  @UseGuards(SessionAuthGuard)
  @ApiQuery({ name: 'offset', required: false, type: 'integer', minimum: 0, default: 0 })
  @ApiOkResponse({ description: 'A page of unexpired CV requests', type: CvRequestPageDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  @Header('Cache-Control', 'no-store')
  findRequests(@Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number): Promise<CvRequestPageDto> {
    return this.requests.findAll(offset);
  }

  @Delete('requests/:id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The CV request was deleted' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  @ApiNotFoundResponse({ description: 'The CV request was not found' })
  removeRequest(@Param('id') id: string): Promise<void> {
    return this.requests.remove(id);
  }
}
