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

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { startDate: 'desc' },
      include: { organization: true, skills: true },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { organization: true, skills: true },
    });
    if (!role) {
      throw new NotFoundException(`Role "${id}" not found`);
    }
    return role;
  }

  async create(dto: CreateRoleDto, actor?: string) {
    const { skills, organizationId, ...rest } = dto;
    try {
      const role = await this.prisma.role.create({
        data: {
          ...rest,
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
      return role;
    } catch (error) {
      throw this.mapPrismaError(error, organizationId);
    }
  }

  async update(id: string, dto: UpdateRoleDto, actor?: string) {
    await this.findOne(id);
    const { skills, organizationId, ...rest } = dto;
    try {
      const role = await this.prisma.role.update({
        where: { id },
        data: {
          ...rest,
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
      return role;
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
}
