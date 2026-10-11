import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { calendarMonthsAgo } from '../privacy/retention.util';
import { TurnstileVerifier } from '../privacy/turnstile-verifier.service';
import { PrivacyErasureService } from '../privacy/privacy-erasure.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly turnstile: TurnstileVerifier,
    private readonly erasures: PrivacyErasureService
  ) {}

  findAll() {
    return this.prisma.contactMessage.findMany({
      where: { createdAt: { gt: calendarMonthsAgo(12) } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Contact message not found');
    await this.erasures.record('ContactMessage', id);
    await this.prisma.contactMessage.delete({ where: { id } });
  }

  async update(id: string, dto: UpdateContactMessageDto) {
    try {
      return await this.prisma.contactMessage.update({
        where: { id },
        data: { isRead: dto.isRead },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Contact message "${id}" not found`);
      }
      throw error;
    }
  }

  async create(dto: CreateContactMessageDto) {
    await this.turnstile.verify(dto.turnstileToken, 'contact');

    const { fullName, email, organization, subject, message } = dto;
    return this.prisma.contactMessage.create({
      data: { fullName, email, organization: organization ?? null, subject, message },
    });
  }
}
