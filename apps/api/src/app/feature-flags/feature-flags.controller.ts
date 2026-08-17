import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FeatureFlagKey } from '../../generated/prisma/enums';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { FeatureFlagDto } from './dto/feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOkResponse({ description: 'All feature flags', type: [FeatureFlagDto] })
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Put(':key')
  @UseGuards(SessionAuthGuard)
  @ApiParam({ name: 'key', enum: FeatureFlagKey })
  @ApiOkResponse({
    description: 'The updated feature flag',
    type: FeatureFlagDto,
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  update(
    @Param('key', new ParseEnumPipe(FeatureFlagKey)) key: FeatureFlagKey,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagsService.update(key, dto);
  }
}
