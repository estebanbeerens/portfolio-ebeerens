import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

const RECENT_ACTIVITY_LIMIT = 8;
const DOWNLOAD_WINDOW_DAYS = 30;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const windowStart = new Date(Date.now() - DOWNLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [totalProjects, totalSkills, earliestRole, resumeDownloadsLast30Days, recentActivity] =
      await this.prisma.$transaction([
        this.prisma.project.count(),
        this.prisma.skill.count(),
        this.prisma.role.findFirst({ orderBy: { startDate: 'asc' }, select: { startDate: true } }),
        this.prisma.resumeDownload.count({ where: { createdAt: { gte: windowStart } } }),
        this.prisma.activityLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: RECENT_ACTIVITY_LIMIT,
        }),
      ]);

    return {
      totalProjects,
      totalSkills,
      yearsExperience: earliestRole ? wholeYearsSince(earliestRole.startDate) : undefined,
      experienceStartDate: earliestRole?.startDate,
      resumeDownloadsLast30Days,
      recentActivity: recentActivity.map((entry) => ({
        ...entry,
        entityId: entry.entityId ?? undefined,
        actor: entry.actor ?? undefined,
      })),
    };
  }
}

function wholeYearsSince(start: Date, now = new Date()): number {
  let years = now.getFullYear() - start.getFullYear();
  const anniversary = new Date(start);
  anniversary.setFullYear(start.getFullYear() + years);
  if (anniversary > now) {
    years -= 1;
  }
  return Math.max(years, 0);
}
