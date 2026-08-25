import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureFlagDto } from '../../feature-flags/dto/feature-flag.dto';
import { ProjectDto } from '../../projects/dto/project.dto';
import { RoleDto } from '../../roles/dto/role.dto';
import { ProfileDto } from './profile.dto';

export class PublicPortfolioDto {
  @ApiPropertyOptional({ type: ProfileDto })
  profile?: ProfileDto;

  @ApiProperty({ description: 'Public professional roles', type: [RoleDto] })
  roles: RoleDto[];

  @ApiProperty({ description: 'Public portfolio projects', type: [ProjectDto] })
  projects: ProjectDto[];

  @ApiProperty({ description: 'Feature flags controlling public sections', type: [FeatureFlagDto] })
  featureFlags: FeatureFlagDto[];
}
