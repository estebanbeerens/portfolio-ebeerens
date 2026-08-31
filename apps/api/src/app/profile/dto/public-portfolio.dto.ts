import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureFlagDto } from '../../feature-flags/dto/feature-flag.dto';
import { PublicProjectDto } from '../../projects/dto/public-project.dto';
import { PublicRoleDto } from '../../roles/dto/public-role.dto';
import { PublicProfileDto } from './public-profile.dto';

export class PublicPortfolioDto {
  @ApiPropertyOptional({ type: PublicProfileDto })
  profile?: PublicProfileDto;

  @ApiProperty({ description: 'Public professional roles', type: [PublicRoleDto] })
  roles: PublicRoleDto[];

  @ApiProperty({ description: 'Public portfolio projects', type: [PublicProjectDto] })
  projects: PublicProjectDto[];

  @ApiProperty({ description: 'Feature flags controlling public sections', type: [FeatureFlagDto] })
  featureFlags: FeatureFlagDto[];
}
