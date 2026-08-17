import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(dto: CreateOrganizationDto) {
    try {
      return await this.prisma.organization.create({ data: dto });
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    try {
      return await this.prisma.organization.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.organization.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete an organization with existing roles',
        );
      }
      throw error;
    }
  }

  private mapPrismaError(error: unknown, name?: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        `An organization with name "${name}" already exists`,
      );
    }
    return error;
  }
}
