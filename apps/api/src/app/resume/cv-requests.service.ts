import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrivacyErasureService } from '../privacy/privacy-erasure.service';
import { calendarMonthsAgo, CV_CONSENT_VERSION } from '../privacy/retention.util';
import { TurnstileVerifier } from '../privacy/turnstile-verifier.service';
import { CvRequestPageDto } from './dto/cv-request.dto';
import { RequestCvDto } from './dto/request-cv.dto';

@Injectable()
export class CvRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly turnstile: TurnstileVerifier,
    private readonly erasures: PrivacyErasureService
  ) {}

  async validate(dto: RequestCvDto): Promise<boolean> {
    const hasDetails = Boolean(dto.fullName || dto.email || dto.reason);
    if (hasDetails && dto.consent !== true) {
      throw new BadRequestException('Consent is required to store optional details; download anonymously instead');
    }
    if (hasDetails) {
      if (!dto.turnstileToken) throw new BadRequestException('Verification is required for optional details');
      await this.turnstile.verify(dto.turnstileToken, 'cv-request');
    }
    return hasDetails;
  }

  async record(dto: RequestCvDto): Promise<void> {
    await this.prisma.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`SET LOCAL statement_timeout = '2000ms'`;
        await transaction.cvRequest.create({
          data: {
            fullName: dto.fullName ?? null,
            email: dto.email ?? null,
            reason: dto.reason ?? null,
            consentedAt: new Date(),
            consentTextVersion: CV_CONSENT_VERSION,
          },
        });
      },
      { maxWait: 1000, timeout: 3000 }
    );
  }

  async findAll(offset = 0): Promise<CvRequestPageDto> {
    if (!Number.isInteger(offset) || offset < 0 || offset > 1000000) {
      throw new BadRequestException('Invalid pagination offset');
    }
    const where = { createdAt: { gt: calendarMonthsAgo(6) } };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cvRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: offset,
        take: 25,
      }),
      this.prisma.cvRequest.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        ...item,
        fullName: item.fullName ?? undefined,
        email: item.email ?? undefined,
        reason: item.reason ?? undefined,
      })),
      total,
      offset,
    };
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.cvRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('The CV request was not found');
    await this.erasures.record('CvRequest', id);
    await this.prisma.cvRequest.deleteMany({ where: { id } });
  }
}
