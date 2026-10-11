import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Locale } from '../shared/locale.util';
import { R2Service } from '../storage/r2.service';
import { CvRequestsService } from './cv-requests.service';
import { CvDownloadDto } from './dto/cv-download.dto';
import { RequestCvDto } from './dto/request-cv.dto';
import { CvContent, fingerprint, ResumeContentService } from './resume-content.service';
import { ResumePdfService } from './resume-pdf.service';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);
  private readonly inFlight = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
    private readonly source: ResumeContentService,
    private readonly pdf: ResumePdfService,
    private readonly requests: CvRequestsService
  ) {}

  async download(locale: Locale, dto: RequestCvDto = {}): Promise<CvDownloadDto> {
    const identifying = await this.requests.validate(dto);
    const downloadUrl = await this.generate(locale);
    const results = await Promise.allSettled([
      this.countDownload(),
      ...(identifying ? [this.requests.record(dto)] : []),
    ]);
    const loggingStatus = !identifying ? 'not-requested' : results[1].status === 'fulfilled' ? 'recorded' : 'failed';
    if (results.some((result) => result.status === 'rejected')) {
      this.logger.warn('CV issued, but optional download logging failed');
    }
    return { downloadUrl, loggingStatus };
  }

  async preview(locale: Locale): Promise<CvDownloadDto> {
    return { downloadUrl: await this.generate(locale, true), loggingStatus: 'not-requested' };
  }

  private async countDownload(): Promise<void> {
    await this.prisma.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`SET LOCAL statement_timeout = '2000ms'`;
        await transaction.resumeDownload.create({ data: {} });
      },
      { maxWait: 1000, timeout: 3000 }
    );
  }

  private async generate(locale: Locale, preview = false): Promise<string> {
    const bucket = process.env.R2_DOCUMENTS_BUCKET;
    if (!bucket) throw new ServiceUnavailableException('CV storage is unavailable');
    for (let attempt = 0; attempt < 2; attempt++) {
      const content = await this.source.snapshot(locale, preview);
      const hash = fingerprint(content);
      const key = `cv/${locale}/${hash}.pdf`;
      try {
        await this.ensureObject(bucket, key, content);
      } catch {
        this.logger.error('CV rendering or storage failed');
        throw new ServiceUnavailableException('CV generation unavailable');
      }
      const latest = await this.source.snapshot(locale, preview);
      if (fingerprint(latest) === hash) {
        try {
          return await this.r2.presignGet(bucket, key, `cv-${locale}.pdf`);
        } catch {
          throw new ServiceUnavailableException('CV delivery unavailable');
        }
      }
    }
    throw new ServiceUnavailableException('CV content changed; please retry');
  }

  private async ensureObject(bucket: string, key: string, content: CvContent): Promise<void> {
    const existing = this.inFlight.get(key);
    if (existing) return existing;
    const pending = (async () => {
      if (await this.r2.objectExists(bucket, key)) return;
      const document = await this.pdf.render(content);
      await this.r2.putObject(bucket, key, document, 'application/pdf', 'private, max-age=300');
    })();
    this.inFlight.set(key, pending);
    try {
      await pending;
    } finally {
      this.inFlight.delete(key);
    }
  }
}
