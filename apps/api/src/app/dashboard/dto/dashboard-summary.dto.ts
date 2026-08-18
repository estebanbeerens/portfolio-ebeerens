import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityEntryDto } from './activity-entry.dto';

export class DashboardSummaryDto {
  @ApiProperty()
  totalProjects!: number;

  @ApiProperty()
  totalSkills!: number;

  @ApiPropertyOptional({ description: 'Whole years since the earliest role start date' })
  yearsExperience?: number;

  @ApiPropertyOptional({ description: 'Start date of the earliest role' })
  experienceStartDate?: Date;

  @ApiProperty()
  resumeDownloadsLast30Days!: number;

  @ApiProperty({ type: [ActivityEntryDto] })
  recentActivity!: ActivityEntryDto[];
}
