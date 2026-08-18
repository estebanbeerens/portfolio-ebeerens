import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivityService } from './activity.service';

@Injectable()
export class ActivityCleanupService {
  constructor(private readonly activityService: ActivityService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredEntries() {
    await this.activityService.purgeExpiredEntries();
  }
}
