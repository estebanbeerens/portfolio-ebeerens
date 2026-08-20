import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService
  ) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { startDate: 'desc' },
      include: { organization: true, skills: true },
    });
    return roles.map((role) => this.normalizeDescription(role));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { organization: true, skills: true },
    });
    if (!role) {
      throw new NotFoundException(`Role "${id}" not found`);
    }
    return this.normalizeDescription(role);
  }

  async create(dto: CreateRoleDto, actor?: string) {
    const { skills, organizationId, startDate, endDate, ...rest } = dto;
    try {
      const role = await this.prisma.role.create({
        data: {
          ...rest,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          organization: { connect: { id: organizationId } },
          skills: this.buildSkillsInput(skills),
        },
        include: { organization: true, skills: true },
      });
      await this.activity.record({
        entityType: 'ROLE',
        action: 'CREATED',
        entityId: role.id,
        summary: `Added ${role.jobTitle} position at ${role.organization.name}`,
        actor,
      });
      return this.normalizeDescription(role);
    } catch (error) {
      throw this.mapPrismaError(error, organizationId);
    }
  }

  async update(id: string, dto: UpdateRoleDto, actor?: string) {
    await this.findOne(id);
    const { skills, organizationId, startDate, endDate, ...rest } = dto;
    try {
      const role = await this.prisma.role.update({
        where: { id },
        data: {
          ...rest,
          // Cleared optional fields are omitted by the client, so null them explicitly rather than leaving them unchanged.
          description: rest.description || null,
          location: rest.location || null,
          employmentType: rest.employmentType || null,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          organization: organizationId ? { connect: { id: organizationId } } : undefined,
          skills: skills ? { set: [], ...this.buildSkillsInput(skills) } : undefined,
        },
        include: { organization: true, skills: true },
      });
      await this.activity.record({
        entityType: 'ROLE',
        action: 'UPDATED',
        entityId: role.id,
        summary: `Updated ${role.jobTitle} position at ${role.organization.name}`,
        actor,
      });
      return this.normalizeDescription(role);
    } catch (error) {
      throw this.mapPrismaError(error, organizationId);
    }
  }

  async remove(id: string, actor?: string) {
    const role = await this.findOne(id);
    await this.prisma.role.delete({ where: { id } });
    await this.activity.record({
      entityType: 'ROLE',
      action: 'DELETED',
      summary: `Deleted ${role.jobTitle} position at ${role.organization.name}`,
      actor,
    });
  }

  // Reuses existing skills by name, creating new ones as needed.
  private buildSkillsInput(skills?: string[]) {
    if (!skills) {
      return undefined;
    }
    return {
      connectOrCreate: skills.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  private mapPrismaError(error: unknown, organizationId?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return new NotFoundException(`Organization "${organizationId}" not found`);
      }
    }
    return error;
  }

  private normalizeDescription<T extends { description: string | null }>(
    role: T
  ): Omit<T, 'description'> & {
    description?: string;
  } {
    const { description, ...rest } = role;
    return description === null ? rest : { ...rest, description };
  }
}
