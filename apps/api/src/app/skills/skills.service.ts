import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { AssignSkillCategoryDto } from './dto/assign-skill-category.dto';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { SkillCategoryDto } from './dto/skill-category.dto';
import { SkillDto } from './dto/skill.dto';
import { SkillManagementDto } from './dto/skill-management.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  async findManagement(): Promise<SkillManagementDto> {
    const [categories, unassignedSkills] = await Promise.all([
      this.prisma.skillCategory.findMany({
        orderBy: { name: 'asc' },
        include: { skills: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
      }),
      this.prisma.skill.findMany({
        where: { skillCategoryId: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        skills: category.skills,
      })),
      unassignedSkills,
    };
  }

  async createCategory(dto: CreateSkillCategoryDto): Promise<SkillCategoryDto> {
    try {
      const category = await this.prisma.skillCategory.create({
        data: { name: dto.name.trim() },
        include: { skills: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
      });
      return category;
    } catch (error) {
      this.throwCategoryError(error);
    }
  }

  async updateCategory(id: string, dto: UpdateSkillCategoryDto): Promise<SkillCategoryDto> {
    try {
      return await this.prisma.skillCategory.update({
        where: { id },
        data: { name: dto.name.trim() },
        include: { skills: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
      });
    } catch (error) {
      this.throwCategoryError(error, id);
    }
  }

  async removeCategory(id: string): Promise<void> {
    try {
      await this.prisma.skillCategory.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Skill category "${id}" not found`);
      }
      throw error;
    }
  }

  async setCategory(id: string, dto: AssignSkillCategoryDto): Promise<SkillDto> {
    try {
      return await this.prisma.skill.update({
        where: { id },
        data: {
          category: dto.categoryId === null ? { disconnect: true } : { connect: { id: dto.categoryId } },
        },
        select: { id: true, name: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Skill or category not found`);
      }
      throw error;
    }
  }

  private throwCategoryError(error: unknown, id?: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A skill category with this name already exists');
      }
      if (error.code === 'P2025' && id) {
        throw new NotFoundException(`Skill category "${id}" not found`);
      }
    }
    throw error;
  }
}
