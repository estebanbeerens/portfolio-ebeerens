import { PrivacyService } from './privacy.service';

describe('PrivacyService', () => {
  it('purges each table at its calendar-month cutoff in one transaction', async () => {
    const deleteRequests = jest.fn();
    const deleteMessages = jest.fn();
    const deleteDownloads = jest.fn();
    const transaction = jest.fn().mockResolvedValue([]);
    const service = new PrivacyService({
      cvRequest: { deleteMany: deleteRequests },
      contactMessage: { deleteMany: deleteMessages },
      resumeDownload: { deleteMany: deleteDownloads },
      $transaction: transaction,
    } as never);

    await service.purgeExpired(new Date('2026-08-31T12:00:00Z'));

    expect(deleteRequests).toHaveBeenCalledWith({ where: { createdAt: { lte: new Date('2026-02-28T12:00:00Z') } } });
    expect(deleteMessages).toHaveBeenCalledWith({ where: { createdAt: { lte: new Date('2025-08-31T12:00:00Z') } } });
    expect(deleteDownloads).toHaveBeenCalledWith({ where: { createdAt: { lte: new Date('2025-08-31T12:00:00Z') } } });
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
