import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService
  ) {}

  findAll() {
    return this.prisma.organization.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization) {
      throw new NotFoundException(`Organization "${id}" not found`);
    }
    return organization;
  }

  async create(dto: CreateOrganizationDto, actor?: string) {
    try {
      const organization = await this.prisma.organization.create({ data: dto });
      await this.activity.record({
        entityType: 'ORGANIZATION',
        action: 'CREATED',
        entityId: organization.id,
        summary: `Added organization "${organization.name}"`,
        actor,
      });
      return organization;
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async update(id: string, dto: UpdateOrganizationDto, actor?: string) {
    await this.findOne(id);
    try {
      const organization = await this.prisma.organization.update({
        where: { id },
        // Cleared optional fields are omitted by the client, so null them explicitly rather than leaving them unchanged.
        data: {
          ...dto,
          logoUrl: dto.logoUrl || null,
          website: dto.website || null,
        },
      });
      await this.activity.record({
        entityType: 'ORGANIZATION',
        action: 'UPDATED',
        entityId: organization.id,
        summary: `Updated organization "${organization.name}"`,
        actor,
      });
      return organization;
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async remove(id: string, actor?: string) {
    const organization = await this.findOne(id);
    try {
      await this.prisma.organization.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Cannot delete an organization with existing roles');
      }
      throw error;
    }
    await this.activity.record({
      entityType: 'ORGANIZATION',
      action: 'DELETED',
      summary: `Deleted organization "${organization.name}"`,
      actor,
    });
  }

  private mapPrismaError(error: unknown, name?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`An organization with name "${name}" already exists`);
    }
    return error;
  }
}
