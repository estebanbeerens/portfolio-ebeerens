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
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { skills: true },
    });
    if (!project) {
      throw new NotFoundException(`Project "${id}" not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    const { skills, description, ...rest } = dto;
    try {
      return await this.prisma.project.create({
        data: {
          ...rest,
          description: description as Prisma.InputJsonValue,
          skills: this.buildSkillsInput(skills),
        },
        include: { skills: true },
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.slug);
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    const { skills, description, ...rest } = dto;
    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          ...rest,
          description: description as Prisma.InputJsonValue | undefined,
          skills: skills
            ? { set: [], ...this.buildSkillsInput(skills) }
            : undefined,
        },
        include: { skills: true },
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.slug);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
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
