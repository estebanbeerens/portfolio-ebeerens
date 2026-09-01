import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { MarkdownRenderService } from '../shared/markdown-render.service';
import { ImageDerivativesService } from '../storage/image-derivatives.service';
import { R2Service } from '../storage/r2.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  function project(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'project-1',
      title: 'Project',
      slug: 'project',
      shortDescriptionEn: 'Short',
      shortDescriptionNl: null,
      descriptionEn: 'Long',
      descriptionNl: null,
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
    const r2 = { isConfigured: false, presignPut: jest.fn(), deleteObject: jest.fn() };
    const derivatives = { generate: jest.fn(), delete: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activity },
        { provide: R2Service, useValue: r2 },
        { provide: ImageDerivativesService, useValue: derivatives },
        MarkdownRenderService,
      ],
    }).compile();

    return { service: moduleRef.get(ProjectsService), prisma, r2, derivatives };
  }

  describe('findPublicAll', () => {
    it('returns localized public projects sorted by latest project date', async () => {
      const { service, prisma } = await build();
      const olderEnded = project({
        id: 'older-ended',
        startDate: new Date('2023-01-01T00:00:00.000Z'),
        endDate: new Date('2023-06-01T00:00:00.000Z'),
      });
      const newerActive = project({
        id: 'newer-active',
        shortDescriptionNl: 'Kort',
        descriptionNl: 'Lang',
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: null,
      });

      prisma.project.findMany.mockResolvedValue([olderEnded, newerActive]);

      const result = await service.findPublicAll('nl');

      expect(result.map((p) => p.id)).toEqual(['newer-active', 'older-ended']);
      expect(result[0]).toMatchObject({ shortDescription: 'Kort', description: 'Lang' });
      expect(result[0]).not.toHaveProperty('shortDescriptionEn');
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { skills: true },
      });
    });
  });

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

  describe('create', () => {
    it('generates image derivatives when the project has an image', async () => {
      const { service, prisma, derivatives } = await build();
      prisma.project.create.mockResolvedValue(project({ imageObjectKey: 'projects/abc123.png' }));

      await service.create({
        title: 'Project',
        slug: 'project',
        shortDescriptionEn: 'Short',
        descriptionEn: 'Long',
        startDate: '2024-01-01T00:00:00.000Z',
        skills: [],
      } as never);

      expect(derivatives.generate).toHaveBeenCalledTimes(1);
      expect(derivatives.generate.mock.calls[0][1]).toBe('projects/abc123.png');
    });

    it('skips derivative generation when the project has no image', async () => {
      const { service, prisma, derivatives } = await build();
      prisma.project.create.mockResolvedValue(project({ imageObjectKey: null }));

      await service.create({
        title: 'Project',
        slug: 'project',
        shortDescriptionEn: 'Short',
        descriptionEn: 'Long',
        startDate: '2024-01-01T00:00:00.000Z',
        skills: [],
      } as never);

      expect(derivatives.generate).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('generates derivatives for a newly uploaded image and cleans up the old one', async () => {
      const { service, prisma, r2, derivatives } = await build();
      r2.isConfigured = true;
      prisma.project.findUnique.mockResolvedValue(project({ imageObjectKey: 'projects/old.png' }));
      prisma.project.update.mockResolvedValue(project({ imageObjectKey: 'projects/new.png' }));

      await service.update('project-1', { imageObjectKey: 'projects/new.png' } as never);

      expect(r2.deleteObject).toHaveBeenCalledWith(process.env.R2_IMAGES_BUCKET, 'projects/old.png');
      expect(derivatives.delete).toHaveBeenCalledWith(process.env.R2_IMAGES_BUCKET, 'projects/old.png');
      expect(derivatives.generate).toHaveBeenCalledWith(process.env.R2_IMAGES_BUCKET, 'projects/new.png');
    });

    it('does not regenerate derivatives when the image is unchanged', async () => {
      const { service, prisma, derivatives } = await build();
      prisma.project.findUnique.mockResolvedValue(project({ imageObjectKey: 'projects/same.png' }));
      prisma.project.update.mockResolvedValue(project({ imageObjectKey: 'projects/same.png' }));

      await service.update('project-1', { imageObjectKey: 'projects/same.png' } as never);

      expect(derivatives.generate).not.toHaveBeenCalled();
    });
  });
});
