import { Body, Controller, Get, Headers, Put, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { actorOf, RequestWithGithubUser, SessionAuthGuard } from '../auth/session-auth.guard';
import { resolveLocale } from '../shared/locale.util';
import { ProfileDto } from './dto/profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { PublicPortfolioDto } from './dto/public-portfolio.dto';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOkResponse({ description: 'The current profile', type: ProfileDto })
  @ApiNotFoundResponse({ description: 'No profile has been created yet' })
  getProfile() {
    return this.profileService.findProfile();
  }

  @Get('public-portfolio')
  @ApiOkResponse({ description: 'All public portfolio content for the initial view', type: PublicPortfolioDto })
  @ApiHeader({
    name: 'x-accept-language',
    required: false,
    description: 'Requested content language (en/nl); defaults to en',
  })
  getPublicPortfolio(@Headers('x-accept-language') language?: string) {
    return this.profileService.findPublicPortfolio(resolveLocale(language));
  }

  @Put()
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({
    description: 'The created or updated profile',
    type: ProfileDto,
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  updateProfile(@Body() dto: UpdateProfileDto, @Req() req: RequestWithGithubUser) {
    return this.profileService.upsertProfile(dto, actorOf(req));
  }
}
