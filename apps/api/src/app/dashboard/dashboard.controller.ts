import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Aggregated admin dashboard data', type: DashboardSummaryDto })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  getSummary(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary();
  }
}
