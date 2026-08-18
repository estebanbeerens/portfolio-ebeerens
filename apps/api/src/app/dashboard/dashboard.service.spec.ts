import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  async function build(transactionResult: unknown[]) {
    const prisma = {
      $transaction: jest.fn().mockResolvedValue(transactionResult),
      project: { count: jest.fn() },
      skill: { count: jest.fn() },
      role: { findFirst: jest.fn() },
      resumeDownload: { count: jest.fn() },
      activityLog: { findMany: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return moduleRef.get(DashboardService);
  }

  it('derives whole years of experience from the earliest role', async () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 7);
    start.setDate(start.getDate() - 1);

    const service = await build([8, 24, { startDate: start }, 156, []]);
    const summary = await service.getSummary();

    expect(summary.totalProjects).toBe(8);
    expect(summary.totalSkills).toBe(24);
    expect(summary.resumeDownloadsLast30Days).toBe(156);
    expect(summary.yearsExperience).toBe(7);
    expect(summary.experienceStartDate).toEqual(start);
  });

  it('leaves experience undefined when there are no roles', async () => {
    const service = await build([0, 0, null, 0, []]);
    const summary = await service.getSummary();

    expect(summary.yearsExperience).toBeUndefined();
    expect(summary.experienceStartDate).toBeUndefined();
  });

  it('does not round a partial year up', async () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 3);
    start.setDate(start.getDate() + 10);

    const service = await build([0, 0, { startDate: start }, 0, []]);
    const summary = await service.getSummary();

    expect(summary.yearsExperience).toBe(2);
  });

  it('maps null activity columns to undefined', async () => {
    const service = await build([
      0,
      0,
      null,
      0,
      [
        {
          id: 'a1',
          entityType: 'PROJECT',
          entityId: null,
          action: 'DELETED',
          summary: 'Deleted project "X"',
          actor: null,
          createdAt: new Date(),
        },
      ],
    ]);
    const summary = await service.getSummary();

    expect(summary.recentActivity[0].entityId).toBeUndefined();
    expect(summary.recentActivity[0].actor).toBeUndefined();
  });
});
