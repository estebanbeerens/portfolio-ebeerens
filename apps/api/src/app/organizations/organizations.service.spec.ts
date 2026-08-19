import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const organization = {
    id: 'org-1',
    name: 'Acme Corp',
    logoUrl: null,
    website: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  function prismaKnownError(code: string) {
    return new Prisma.PrismaClientKnownRequestError('mock', {
      code,
      clientVersion: 'mock',
    });
  }

  async function build() {
    const prisma = {
      organization: {
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
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activity },
      ],
    }).compile();

    return {
      service: moduleRef.get(OrganizationsService),
      prisma,
      activity,
    };
  }

  it('lists organizations ordered by name ascending', async () => {
    const { service, prisma } = await build();
    prisma.organization.findMany.mockResolvedValue([organization]);

    await expect(service.findAll()).resolves.toEqual([organization]);
    expect(prisma.organization.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });

  it('throws NotFoundException when the organization does not exist', async () => {
    const { service, prisma } = await build();
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an organization and records activity', async () => {
    const { service, prisma, activity } = await build();
    prisma.organization.create.mockResolvedValue(organization);

    await expect(service.create({ name: 'Acme Corp' })).resolves.toEqual(organization);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'ORGANIZATION', action: 'CREATED', entityId: organization.id })
    );
  });

  it('maps a duplicate name conflict to ConflictException on create', async () => {
    const { service, prisma } = await build();
    prisma.organization.create.mockRejectedValue(prismaKnownError('P2002'));

    await expect(service.create({ name: 'Acme Corp' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates an organization after confirming it exists', async () => {
    const { service, prisma, activity } = await build();
    prisma.organization.findUnique.mockResolvedValue(organization);
    prisma.organization.update.mockResolvedValue({ ...organization, website: 'https://acme.example' });

    await expect(service.update('org-1', { website: 'https://acme.example' })).resolves.toMatchObject({
      website: 'https://acme.example',
    });
    expect(activity.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATED' }));
  });

  it('removes an organization and records activity', async () => {
    const { service, prisma, activity } = await build();
    prisma.organization.findUnique.mockResolvedValue(organization);
    prisma.organization.delete.mockResolvedValue(organization);

    await service.remove('org-1');

    expect(prisma.organization.delete).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    expect(activity.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETED' }));
  });

  it('maps a foreign-key violation on delete to ConflictException', async () => {
    const { service, prisma } = await build();
    prisma.organization.findUnique.mockResolvedValue(organization);
    prisma.organization.delete.mockRejectedValue(prismaKnownError('P2003'));

    await expect(service.remove('org-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
