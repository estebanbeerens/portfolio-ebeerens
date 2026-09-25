import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

const include = { institution: true } as const;

@Injectable()
export class EducationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService
  ) {}

  async findAll() {
    return this.prisma.education.findMany({ orderBy: { startDate: 'desc' }, include });
  }

  async findOne(id: string) {
    const education = await this.prisma.education.findUnique({ where: { id }, include });
    if (!education) throw new NotFoundException(`Education "${id}" not found`);
    return education;
  }

  async create(dto: CreateEducationDto, actor?: string) {
    try {
      const education = await this.prisma.education.create({ data: this.toCreateData(dto), include });
      await this.activity.record({
        entityType: 'EDUCATION',
        action: 'CREATED',
        entityId: education.id,
        summary: `Added ${education.degree} at ${education.institution.name}`,
        actor,
      });
      return this.normalize(education);
    } catch (error) {
      throw this.mapError(error, dto.institutionId);
    }
  }

  async update(id: string, dto: UpdateEducationDto, actor?: string) {
    await this.findOne(id);
    try {
      const education = await this.prisma.education.update({ where: { id }, data: this.toUpdateData(dto), include });
      await this.activity.record({
        entityType: 'EDUCATION',
        action: 'UPDATED',
        entityId: education.id,
        summary: `Updated ${education.degree} at ${education.institution.name}`,
        actor,
      });
      return this.normalize(education);
    } catch (error) {
      throw this.mapError(error, dto.institutionId);
    }
  }

  async remove(id: string, actor?: string) {
    const education = await this.findOne(id);
    await this.prisma.education.delete({ where: { id } });
    await this.activity.record({
      entityType: 'EDUCATION',
      action: 'DELETED',
      summary: `Deleted ${education.degree} at ${education.institution.name}`,
      actor,
    });
  }

  private toCreateData(dto: CreateEducationDto): Prisma.EducationUncheckedCreateInput {
    return {
      degree: dto.degree,
      fieldOfStudy: dto.fieldOfStudy || null,
      institutionId: dto.institutionId,
      descriptionEn: dto.descriptionEn || null,
      descriptionNl: dto.descriptionNl || null,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    };
  }

  private toUpdateData(dto: UpdateEducationDto): Prisma.EducationUncheckedUpdateInput {
    return {
      ...(dto.degree !== undefined ? { degree: dto.degree } : {}),
      ...(dto.fieldOfStudy !== undefined ? { fieldOfStudy: dto.fieldOfStudy || null } : {}),
      ...(dto.descriptionEn !== undefined ? { descriptionEn: dto.descriptionEn || null } : {}),
      ...(dto.descriptionNl !== undefined ? { descriptionNl: dto.descriptionNl || null } : {}),
      ...(dto.institutionId !== undefined ? { institutionId: dto.institutionId } : {}),
      ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
      ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
    };
  }

  private normalize<T extends { descriptionEn: string | null; descriptionNl: string | null }>(education: T) {
    const { descriptionEn, descriptionNl, ...rest } = education;
    return { ...rest, descriptionEn: descriptionEn ?? undefined, descriptionNl: descriptionNl ?? undefined };
  }

  private mapError(error: unknown, institutionId?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
      return new NotFoundException(`Institution "${institutionId}" not found`);
    return error;
  }
}
