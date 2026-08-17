import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

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
    await this.verifyRecaptcha(dto.recaptchaToken);

    const { fullName, email, subject, message } = dto;
    return this.prisma.contactMessage.create({
      data: { fullName, email, subject, message },
    });
  }

  // Verifies the token with Google rather than trusting the client.
  private async verifyRecaptcha(token: string) {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      this.logger.error('RECAPTCHA_SECRET_KEY is not configured');
      throw new BadRequestException('reCAPTCHA verification is unavailable');
    }

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    const result = (await response.json()) as { success: boolean };
    if (!result.success) {
      throw new BadRequestException('reCAPTCHA verification failed');
    }
  }
}
