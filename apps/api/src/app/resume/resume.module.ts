import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { PrivacyModule } from '../privacy/privacy.module';
import { StorageModule } from '../storage/storage.module';
import { CvRequestsService } from './cv-requests.service';
import { ResumeContentService } from './resume-content.service';
import { ResumePdfService } from './resume-pdf.service';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [PrismaModule, AuthModule, PrivacyModule, StorageModule],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeContentService, ResumePdfService, CvRequestsService],
  exports: [ResumeService],
})
export class ResumeModule {}
