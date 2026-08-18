import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivityAction, ActivityEntity } from '../../generated/prisma/enums';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { R2Service } from '../storage/r2.service';
import { ConfirmResumeUploadDto } from './dto/confirm-resume-upload.dto';
import { CreateResumeUploadUrlDto } from './dto/create-resume-upload-url.dto';

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
    private readonly activity: ActivityService
  ) {}

  private get bucket(): string {
    return process.env.R2_DOCUMENTS_BUCKET as string;
  }

  async createUploadUrl(dto: CreateResumeUploadUrlDto) {
    const objectKey = `resume/${randomUUID()}.pdf`;
    const uploadUrl = await this.r2.presignPut(this.bucket, objectKey, dto.mimeType, dto.fileSize);
    return { uploadUrl, objectKey };
  }

  // There is only ever one resume, so confirming an upload replaces the existing row.
  async confirmUpload(dto: ConfirmResumeUploadDto, actor?: string) {
    const existing = await this.prisma.resume.findFirst();
    const resume = existing
      ? await this.prisma.resume.update({ where: { id: existing.id }, data: dto })
      : await this.prisma.resume.create({ data: dto });

    await this.activity.record({
      entityType: ActivityEntity.RESUME,
      entityId: resume.id,
      action: existing ? ActivityAction.UPDATED : ActivityAction.CREATED,
      summary: existing ? `Replaced the resume with "${dto.fileName}"` : `Uploaded resume "${dto.fileName}"`,
      actor,
    });

    return resume;
  }

  async findResume() {
    const resume = await this.prisma.resume.findFirst();
    if (!resume) {
      throw new NotFoundException('No resume has been uploaded yet');
    }
    return resume;
  }

  /** Records the download before handing back a short-lived signed URL. */
  async registerDownload() {
    const resume = await this.findResume();
    await this.prisma.resumeDownload.create({ data: { resumeId: resume.id } });
    return this.r2.presignGet(this.bucket, resume.objectKey, resume.fileName);
  }
}
