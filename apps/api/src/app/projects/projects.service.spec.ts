import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  function project(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'project-1',
      title: 'Project',
      slug: 'project',
      shortDescription: 'Short',
      description: 'Long',
      imageUrl: null,
      client: null,
      jobRole: null,
      liveUrl: null,
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: null,
      skills: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  async function build() {
    const prisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const activity = { record: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activity },
      ],
    }).compile();

    return { service: moduleRef.get(ProjectsService), prisma };
  }

  describe('findRelated', () => {
    it('throws NotFoundException when the target project does not exist', async () => {
      const { service, prisma } = await build();
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findRelated('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('ranks projects with more shared skills first, excluding the target itself', async () => {
      const { service, prisma } = await build();
      const target = project({ id: 'target', skills: [{ id: 'ts' }, { id: 'angular' }] });
      const oneMatch = project({
        id: 'one-match',
        skills: [{ id: 'ts' }],
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
      });
      const twoMatches = project({
        id: 'two-matches',
        skills: [{ id: 'ts' }, { id: 'angular' }],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const noMatch = project({ id: 'no-match', skills: [], createdAt: new Date('2026-01-10T00:00:00.000Z') });

      prisma.project.findUnique.mockResolvedValue(target);
      prisma.project.findMany.mockResolvedValue([oneMatch, twoMatches, noMatch]);

      const result = await service.findRelated('target', 3);

      expect(result.map((p) => p.id)).toEqual(['two-matches', 'one-match', 'no-match']);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { id: { not: 'target' } },
        orderBy: { createdAt: 'desc' },
        include: { skills: true },
      });
    });

    it('breaks ties in shared-skill count by most recent end/start date', async () => {
      const { service, prisma } = await build();
      const target = project({ id: 'target', skills: [{ id: 'ts' }] });
      const older = project({
        id: 'older',
        skills: [{ id: 'ts' }],
        startDate: new Date('2023-01-01T00:00:00.000Z'),
        endDate: new Date('2023-06-01T00:00:00.000Z'),
      });
      const newer = project({
        id: 'newer',
        skills: [{ id: 'ts' }],
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: null,
      });

      prisma.project.findUnique.mockResolvedValue(target);
      prisma.project.findMany.mockResolvedValue([older, newer]);

      const result = await service.findRelated('target', 2);

      expect(result.map((p) => p.id)).toEqual(['newer', 'older']);
    });

    it('pads with recent non-matching projects when fewer than limit share a skill', async () => {
      const { service, prisma } = await build();
      const target = project({ id: 'target', skills: [{ id: 'ts' }] });
      const match = project({ id: 'match', skills: [{ id: 'ts' }] });
      const recentNoMatch = project({
        id: 'recent-no-match',
        skills: [],
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      });
      const olderNoMatch = project({
        id: 'older-no-match',
        skills: [],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      });

      prisma.project.findUnique.mockResolvedValue(target);
      prisma.project.findMany.mockResolvedValue([match, recentNoMatch, olderNoMatch]);

      const result = await service.findRelated('target', 3);

      expect(result.map((p) => p.id)).toEqual(['match', 'recent-no-match', 'older-no-match']);
    });

    it('respects the limit', async () => {
      const { service, prisma } = await build();
      const target = project({ id: 'target', skills: [] });
      prisma.project.findUnique.mockResolvedValue(target);
      prisma.project.findMany.mockResolvedValue([project({ id: 'a' }), project({ id: 'b' }), project({ id: 'c' })]);

      const result = await service.findRelated('target', 2);

      expect(result).toHaveLength(2);
    });
  });
});
