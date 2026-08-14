import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project "${id}" not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    try {
      return await this.prisma.project.create({
        data: { ...dto, description: dto.description as Prisma.InputJsonValue },
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.slug);
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          ...dto,
          description: dto.description as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.slug);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
  }

  private mapPrismaError(error: unknown, slug?: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        `A project with slug "${slug}" already exists`,
      );
    }
    return error;
  }
}
