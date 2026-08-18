import { Injectable } from '@nestjs/common';
import { ActivityAction, ActivityEntity } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma.service';

const RETENTION_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

export interface RecordActivityInput {
  entityType: ActivityEntity;
  action: ActivityAction;
  summary: string;
  entityId?: string;
  actor?: string;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordActivityInput) {
    await this.prisma.activityLog.create({
      data: {
        entityType: input.entityType,
        action: input.action,
        summary: input.summary,
        entityId: input.entityId ?? null,
        actor: input.actor ?? null,
      },
    });
  }

  async findRecent(limit: number) {
    const entries = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return entries.map((entry) => ({
      ...entry,
      entityId: entry.entityId ?? undefined,
      actor: entry.actor ?? undefined,
    }));
  }

  async purgeExpiredEntries() {
    await this.prisma.activityLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
    });
  }
}
