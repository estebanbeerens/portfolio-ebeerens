import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { calendarMonthsAgo } from './retention.util';

@Injectable()
export class PrivacyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.EXPORT_OPENAPI !== 'true') {
      await this.purgeExpired();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async purgeExpired(now = new Date()): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.cvRequest.deleteMany({ where: { createdAt: { lte: calendarMonthsAgo(6, now) } } }),
        this.prisma.contactMessage.deleteMany({ where: { createdAt: { lte: calendarMonthsAgo(12, now) } } }),
        this.prisma.resumeDownload.deleteMany({ where: { createdAt: { lte: calendarMonthsAgo(12, now) } } }),
      ]);
    } catch {
      this.logger.error('Privacy retention cleanup failed; expired submissions remain excluded from admin reads');
    }
  }
}
