import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

describe('ContactService', () => {
  const originalTurnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const originalFetch = globalThis.fetch;

  const dto: CreateContactMessageDto = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    organization: 'Acme Inc.',
    subject: 'Project inquiry',
    message: 'Can we talk about a project?',
    turnstileToken: 'turnstile-token',
  };

  async function build() {
    const prisma = {
      contactMessage: {
        findMany: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ContactService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(ContactService), prisma };
  }

  function mockTurnstileResult(result: { success: boolean; action?: string; 'error-codes'?: string[] }) {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ json: jest.fn().mockResolvedValue(result) } as unknown as Response);
  }

  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = 'secret';
  });

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalTurnstileSecret;
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('verifies the Turnstile token before storing the message', async () => {
    const { service, prisma } = await build();
    const createdAt = new Date('2026-08-20T00:00:00.000Z');
    const message = { id: 'message-1', ...dto, organization: 'Acme Inc.', createdAt };
    prisma.contactMessage.create.mockResolvedValue(message);
    mockTurnstileResult({ success: true, action: 'contact' });

    await expect(service.create(dto)).resolves.toBe(message);

    expect(globalThis.fetch).toHaveBeenCalledWith('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: 'secret', response: 'turnstile-token' }),
    });
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        organization: 'Acme Inc.',
        subject: 'Project inquiry',
        message: 'Can we talk about a project?',
      },
    });
  });

  it('does not store the message when the Turnstile secret is missing', async () => {
    const { service, prisma } = await build();
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);

    expect(globalThis.fetch).toBe(originalFetch);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('does not store the message when Turnstile rejects the token', async () => {
    const { service, prisma } = await build();
    mockTurnstileResult({ success: false, 'error-codes': ['invalid-input-response'] });

    await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('does not store the message when the Turnstile action does not match the contact form', async () => {
    const { service, prisma } = await build();
    mockTurnstileResult({ success: true, action: 'newsletter' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('writes an omitted organization as storage null', async () => {
    const { service, prisma } = await build();
    prisma.contactMessage.create.mockResolvedValue({ id: 'message-1' });
    mockTurnstileResult({ success: true, action: 'contact' });

    await service.create({ ...dto, organization: undefined });

    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organization: null }) })
    );
  });
});
