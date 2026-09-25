import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { R2Service } from '../storage/r2.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { CreateInstitutionLogoUploadUrlDto } from './dto/create-institution-logo-upload-url.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly r2: R2Service
  ) {}

  async createLogoUploadUrl(dto: CreateInstitutionLogoUploadUrlDto) {
    const extension = dto.mimeType.split('/')[1];
    const objectKey = `institutions/${randomUUID()}.${extension}`;
    const uploadUrl = await this.r2.presignPut(
      process.env.R2_IMAGES_BUCKET as string,
      objectKey,
      dto.mimeType,
      dto.fileSize
    );
    return { uploadUrl, objectKey, publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${objectKey}` };
  }

  findAll() {
    return this.prisma.institution.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateInstitutionDto, actor?: string) {
    try {
      const institution = await this.prisma.institution.create({ data: dto });
      await this.activity.record({
        entityType: 'INSTITUTION',
        action: 'CREATED',
        entityId: institution.id,
        summary: `Added institution "${institution.name}"`,
        actor,
      });
      return institution;
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async update(id: string, dto: UpdateInstitutionDto, actor?: string) {
    const existing = await this.findOne(id);
    try {
      const institution = await this.prisma.institution.update({
        where: { id },
        data: {
          ...dto,
          logoUrl: dto.logoUrl || null,
          logoObjectKey: dto.logoUrl ? (dto.logoObjectKey ?? existing.logoObjectKey) : null,
          website: dto.website || null,
        },
      });
      if (existing.logoObjectKey && existing.logoObjectKey !== institution.logoObjectKey) {
        await this.deleteLogoObject(existing.logoObjectKey);
      }
      await this.activity.record({
        entityType: 'INSTITUTION',
        action: 'UPDATED',
        entityId: institution.id,
        summary: `Updated institution "${institution.name}"`,
        actor,
      });
      return institution;
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) throw new NotFoundException(`Institution "${id}" not found`);
    return institution;
  }

  async remove(id: string, actor?: string) {
    const institution = await this.findOne(id);
    try {
      await this.prisma.institution.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Cannot delete an institution with existing education entries');
      }
      throw error;
    }
    if (institution.logoObjectKey) await this.deleteLogoObject(institution.logoObjectKey);
    await this.activity.record({
      entityType: 'INSTITUTION',
      action: 'DELETED',
      summary: `Deleted institution "${institution.name}"`,
      actor,
    });
  }

  private async deleteLogoObject(objectKey: string): Promise<void> {
    if (!this.r2.isConfigured) return;
    try {
      await this.r2.deleteObject(process.env.R2_IMAGES_BUCKET as string, objectKey);
    } catch (error) {
      this.logger.warn(`Failed to delete stale institution logo "${objectKey}": ${error}`);
    }
  }

  private mapPrismaError(error: unknown, name?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`An institution with name "${name}" already exists`);
    }
    return error;
  }
}
