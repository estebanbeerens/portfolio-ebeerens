import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CONTACT_TURNSTILE_ACTION = 'contact';

type TurnstileSiteverifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    await this.prisma.contactMessage.delete({ where: { id } });
  }

  async create(dto: CreateContactMessageDto) {
    await this.verifyTurnstile(dto.turnstileToken);

    const { fullName, email, organization, subject, message } = dto;
    return this.prisma.contactMessage.create({
      data: { fullName, email, organization: organization ?? null, subject, message },
    });
  }

  private async verifyTurnstile(token: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      this.logger.error('TURNSTILE_SECRET_KEY is not configured');
      throw new BadRequestException('Turnstile verification is unavailable');
    }

    let result: TurnstileSiteverifyResponse;
    try {
      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
      });
      result = (await response.json()) as TurnstileSiteverifyResponse;
    } catch (error) {
      this.logger.error('Turnstile verification request failed', error);
      throw new BadRequestException('Turnstile verification failed');
    }

    if (!result.success) {
      this.logger.warn(`Turnstile verification failed: ${result['error-codes']?.join(', ') ?? 'unknown error'}`);
      throw new BadRequestException('Turnstile verification failed');
    }

    if (result.action !== CONTACT_TURNSTILE_ACTION) {
      this.logger.warn(`Turnstile action mismatch: ${result.action ?? 'missing'}`);
      throw new BadRequestException('Turnstile verification failed');
    }
  }
}
