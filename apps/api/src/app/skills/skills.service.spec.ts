import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  const skill = { id: 'skill-1', name: 'Angular' };
  const category = {
    id: 'category-1',
    name: 'Frontend',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    skills: [skill],
  };

  function prismaKnownError(code: string) {
    return new Prisma.PrismaClientKnownRequestError('mock', {
      code,
      clientVersion: 'mock',
    });
  }

  async function build() {
    const prisma = {
      skill: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      skillCategory: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [SkillsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(SkillsService), prisma };
  }

  it('returns the public skill list with only public fields', async () => {
    const { service, prisma } = await build();
    prisma.skill.findMany.mockResolvedValue([skill]);

    await expect(service.findAll()).resolves.toEqual([skill]);
    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  });

  it('returns sorted categories with assigned and unassigned skills', async () => {
    const { service, prisma } = await build();
    prisma.skillCategory.findMany.mockResolvedValue([category]);
    prisma.skill.findMany.mockResolvedValue([{ id: 'skill-2', name: 'TypeScript' }]);

    await expect(service.findManagement()).resolves.toEqual({
      categories: [category],
      unassignedSkills: [{ id: 'skill-2', name: 'TypeScript' }],
    });
    expect(prisma.skillCategory.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: { skills: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
    });
    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      where: { skillCategoryId: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  });

  it('creates a category using a trimmed name', async () => {
    const { service, prisma } = await build();
    prisma.skillCategory.create.mockResolvedValue(category);

    await expect(service.createCategory({ name: ' Frontend ' })).resolves.toEqual(category);
    expect(prisma.skillCategory.create).toHaveBeenCalledWith({
      data: { name: 'Frontend' },
      include: { skills: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
    });
  });

  it('maps duplicate category names to a conflict', async () => {
    const { service, prisma } = await build();
    prisma.skillCategory.create.mockRejectedValue(prismaKnownError('P2002'));

    await expect(service.createCategory({ name: 'Frontend' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a missing category during rename to not found', async () => {
    const { service, prisma } = await build();
    prisma.skillCategory.update.mockRejectedValue(prismaKnownError('P2025'));

    await expect(service.updateCategory('missing', { name: 'Frontend' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps duplicate category names to a conflict during rename', async () => {
    const { service, prisma } = await build();
    prisma.skillCategory.update.mockRejectedValue(prismaKnownError('P2002'));

    await expect(service.updateCategory('category-1', { name: 'Backend' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes categories, allowing the database relation to unassign their skills', async () => {
    const { service, prisma } = await build();

    await expect(service.removeCategory('category-1')).resolves.toBeUndefined();
    expect(prisma.skillCategory.delete).toHaveBeenCalledWith({ where: { id: 'category-1' } });
  });

  it('maps a missing category during delete to not found', async () => {
    const { service, prisma } = await build();
    prisma.skillCategory.delete.mockRejectedValue(prismaKnownError('P2025'));

    await expect(service.removeCategory('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('connects a skill to a category', async () => {
    const { service, prisma } = await build();
    prisma.skill.update.mockResolvedValue(skill);

    await expect(service.setCategory('skill-1', { categoryId: 'category-1' })).resolves.toEqual(skill);
    expect(prisma.skill.update).toHaveBeenCalledWith({
      where: { id: 'skill-1' },
      data: { category: { connect: { id: 'category-1' } } },
      select: { id: true, name: true },
    });
  });

  it('disconnects a skill from its category and maps missing ids to not found', async () => {
    const { service, prisma } = await build();
    prisma.skill.update.mockResolvedValue(skill);

    await service.setCategory('skill-1', { categoryId: null });
    expect(prisma.skill.update).toHaveBeenCalledWith({
      where: { id: 'skill-1' },
      data: { category: { disconnect: true } },
      select: { id: true, name: true },
    });

    prisma.skill.update.mockRejectedValue(prismaKnownError('P2025'));
    await expect(service.setCategory('missing', { categoryId: null })).rejects.toBeInstanceOf(NotFoundException);
  });
});
