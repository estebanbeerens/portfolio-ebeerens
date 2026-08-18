import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ActivityCleanupService } from './activity-cleanup.service';
import { ActivityService } from './activity.service';

@Module({
  imports: [PrismaModule],
  providers: [ActivityService, ActivityCleanupService],
  exports: [ActivityService],
})
export class ActivityModule {}
