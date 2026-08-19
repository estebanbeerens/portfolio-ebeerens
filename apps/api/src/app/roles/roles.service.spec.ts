import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const organization = {
    id: 'org-1',
    name: 'Acme Corp',
    logoUrl: null,
    website: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const role = {
    id: 'role-1',
    jobTitle: 'Engineer',
    organizationId: 'org-1',
    organization,
    location: null,
    employmentType: null,
    startDate: new Date('2024-01-15T00:00:00.000Z'),
    endDate: null,
    skills: [],
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
      role: {
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
        RolesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activity },
      ],
    }).compile();

    return {
      service: moduleRef.get(RolesService),
      prisma,
      activity,
    };
  }

  it('lists roles ordered by start date descending with organization and skills included', async () => {
    const { service, prisma } = await build();
    prisma.role.findMany.mockResolvedValue([role]);

    await expect(service.findAll()).resolves.toEqual([role]);
    expect(prisma.role.findMany).toHaveBeenCalledWith({
      orderBy: { startDate: 'desc' },
      include: { organization: true, skills: true },
    });
  });

  it('throws NotFoundException when the role does not exist', async () => {
    const { service, prisma } = await build();
    prisma.role.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a role, connecting the organization and reusing/creating skills by name', async () => {
    const { service, prisma, activity } = await build();
    prisma.role.create.mockResolvedValue({ ...role, skills: [{ id: 'skill-1', name: 'typescript' }] });

    await service.create({
      jobTitle: 'Engineer',
      organizationId: 'org-1',
      startDate: '2024-01-15',
      skills: ['typescript'],
    });

    expect(prisma.role.create).toHaveBeenCalledWith({
      data: {
        jobTitle: 'Engineer',
        startDate: new Date('2024-01-15'),
        endDate: undefined,
        organization: { connect: { id: 'org-1' } },
        skills: { connectOrCreate: [{ where: { name: 'typescript' }, create: { name: 'typescript' } }] },
      },
      include: { organization: true, skills: true },
    });
    expect(activity.record).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'ROLE', action: 'CREATED' }));
  });

  it('maps a missing organization on create to NotFoundException', async () => {
    const { service, prisma } = await build();
    prisma.role.create.mockRejectedValue(prismaKnownError('P2025'));

    await expect(
      service.create({ jobTitle: 'Engineer', organizationId: 'missing-org', startDate: '2024-01-15' })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates two roles under the same organization independently', async () => {
    const { service, prisma } = await build();
    prisma.role.create
      .mockResolvedValueOnce(role)
      .mockResolvedValueOnce({ ...role, id: 'role-2', jobTitle: 'Senior Engineer' });

    await service.create({ jobTitle: 'Engineer', organizationId: 'org-1', startDate: '2022-01-01' });
    await service.create({ jobTitle: 'Senior Engineer', organizationId: 'org-1', startDate: '2024-01-15' });

    expect(prisma.role.create).toHaveBeenCalledTimes(2);
    expect(prisma.role.create.mock.calls[0][0].data.organization).toEqual({ connect: { id: 'org-1' } });
    expect(prisma.role.create.mock.calls[1][0].data.organization).toEqual({ connect: { id: 'org-1' } });
  });

  it('clears and reconnects skills as a full replacement on update', async () => {
    const { service, prisma, activity } = await build();
    prisma.role.findUnique.mockResolvedValue(role);
    prisma.role.update.mockResolvedValue({ ...role, skills: [{ id: 'skill-2', name: 'nestjs' }] });

    await service.update('role-1', { skills: ['nestjs'] });

    expect(prisma.role.update).toHaveBeenCalledWith({
      where: { id: 'role-1' },
      data: {
        startDate: undefined,
        endDate: undefined,
        organization: undefined,
        skills: { set: [], connectOrCreate: [{ where: { name: 'nestjs' }, create: { name: 'nestjs' } }] },
      },
      include: { organization: true, skills: true },
    });
    expect(activity.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATED' }));
  });

  it('removes a role and records activity', async () => {
    const { service, prisma, activity } = await build();
    prisma.role.findUnique.mockResolvedValue(role);
    prisma.role.delete.mockResolvedValue(role);

    await service.remove('role-1');

    expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
    expect(activity.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETED' }));
  });
});
