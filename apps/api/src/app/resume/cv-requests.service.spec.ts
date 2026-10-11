import { CvRequestsService } from './cv-requests.service';
import { CV_CONSENT_VERSION } from '../privacy/retention.util';

describe('CvRequestsService', () => {
  function build() {
    const create = jest.fn();
    const transaction = { $executeRaw: jest.fn(), cvRequest: { create } };
    const prisma = { $transaction: (callback: (value: unknown) => unknown) => callback(transaction) };
    const turnstile = { verify: jest.fn() };
    return { service: new CvRequestsService(prisma as never, turnstile as never, {} as never), create, turnstile };
  }

  it('allows anonymous downloads without verification', async () => {
    const { service, turnstile } = build();
    expect(await service.validate({})).toBe(false);
    expect(turnstile.verify).not.toHaveBeenCalled();
  });

  it('rejects supplied details without consent or verification', async () => {
    const { service } = build();
    await expect(service.validate({ fullName: 'Jane' })).rejects.toThrow('Consent is required');
    await expect(service.validate({ fullName: 'Jane', consent: true })).rejects.toThrow('Verification is required');
  });

  it('verifies action and stores only consented details and consent evidence', async () => {
    const { service, turnstile, create } = build();
    const dto = { fullName: 'Jane', consent: true, turnstileToken: 'token' };
    expect(await service.validate(dto)).toBe(true);
    await service.record(dto);
    expect(turnstile.verify).toHaveBeenCalledWith('token', 'cv-request');
    expect(create).toHaveBeenCalledWith({
      data: {
        fullName: 'Jane',
        email: null,
        reason: null,
        consentedAt: expect.any(Date),
        consentTextVersion: CV_CONSENT_VERSION,
      },
    });
  });

  it('records erasure before deleting and leaves live data intact if storage fails', async () => {
    const prisma = {
      cvRequest: { findUnique: jest.fn().mockResolvedValue({ id: 'request-1' }), deleteMany: jest.fn() },
    };
    const erasures = {
      record: jest.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValue(undefined),
    };
    const service = new CvRequestsService(prisma as never, {} as never, erasures as never);
    await expect(service.remove('request-1')).rejects.toThrow('storage unavailable');
    expect(prisma.cvRequest.deleteMany).not.toHaveBeenCalled();
    await service.remove('request-1');
    expect(erasures.record).toHaveBeenCalledWith('CvRequest', 'request-1');
    expect(erasures.record.mock.invocationCallOrder[1]).toBeLessThan(
      prisma.cvRequest.deleteMany.mock.invocationCallOrder[0]
    );
  });

  it('rejects invalid pagination before querying personal data', async () => {
    const { service } = build();
    await expect(service.findAll(-1)).rejects.toThrow('Invalid pagination');
    await expect(service.findAll(1.5)).rejects.toThrow('Invalid pagination');
  });
});
