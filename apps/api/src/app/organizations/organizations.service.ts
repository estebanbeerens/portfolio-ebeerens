import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { R2Service } from '../storage/r2.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateOrganizationLogoUploadUrlDto } from './dto/create-organization-logo-upload-url.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly r2: R2Service
  ) {}

  private get imagesBucket(): string {
    return process.env.R2_IMAGES_BUCKET as string;
  }

  async createLogoUploadUrl(dto: CreateOrganizationLogoUploadUrlDto) {
    const extension = dto.mimeType.split('/')[1];
    const objectKey = `organizations/${randomUUID()}.${extension}`;
    const uploadUrl = await this.r2.presignPut(this.imagesBucket, objectKey, dto.mimeType, dto.fileSize);
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${objectKey}`;
    return { uploadUrl, objectKey, publicUrl };
  }

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
    const existing = await this.findOne(id);
    try {
      const organization = await this.prisma.organization.update({
        where: { id },
        // Cleared optional fields are omitted by the client, so null them explicitly rather than leaving them unchanged.
        data: {
          ...dto,
          logoUrl: dto.logoUrl || null,
          // `logoObjectKey` isn't exposed on OrganizationDto (it's an internal R2 detail), so the
          // client can only ever send a *new* key from a fresh upload. Keep the existing key when
          // the logo is unchanged.
          logoObjectKey: dto.logoUrl ? (dto.logoObjectKey ?? existing.logoObjectKey) : null,
          website: dto.website || null,
        },
      });
      if (existing.logoObjectKey && existing.logoObjectKey !== organization.logoObjectKey) {
        await this.deleteLogoObject(existing.logoObjectKey);
      }
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
    if (organization.logoObjectKey) {
      await this.deleteLogoObject(organization.logoObjectKey);
    }
    await this.activity.record({
      entityType: 'ORGANIZATION',
      action: 'DELETED',
      summary: `Deleted organization "${organization.name}"`,
      actor,
    });
  }

  // Best-effort: an R2 delete failure shouldn't fail an otherwise-successful organization mutation.
  private async deleteLogoObject(objectKey: string): Promise<void> {
    if (!this.r2.isConfigured) {
      return;
    }
    try {
      await this.r2.deleteObject(this.imagesBucket, objectKey);
    } catch (error) {
      this.logger.warn(`Failed to delete stale organization logo "${objectKey}" from R2: ${error}`);
    }
  }

  private mapPrismaError(error: unknown, name?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`An organization with name "${name}" already exists`);
    }
    return error;
  }
}
