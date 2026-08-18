import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { actorOf, RequestWithGithubUser, SessionAuthGuard } from '../auth/session-auth.guard';
import { ProfileDto } from './dto/profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

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
