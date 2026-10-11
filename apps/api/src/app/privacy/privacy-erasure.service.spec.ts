import { PrivacyErasureService } from './privacy-erasure.service';

describe('PrivacyErasureService', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('fails closed in production when independent erasure storage is unavailable', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.R2_BACKUPS_BUCKET;
    const service = new PrivacyErasureService({ isConfigured: false } as never);
    await expect(service.record('CvRequest', 'request-1')).rejects.toThrow('Privacy erasure storage is unavailable');
  });

  it('records only the table, record identifier and time in private storage', async () => {
    process.env.R2_BACKUPS_BUCKET = 'backups';
    const storage = { isConfigured: true, putObject: jest.fn() };
    await new PrivacyErasureService(storage as never).record('CvRequest', 'request-1');
    const [bucket, key, body, contentType, cacheControl] = storage.putObject.mock.calls[0];
    expect(bucket).toBe('backups');
    expect(key).toBe('erasures/CvRequest/request-1.json');
    expect(JSON.parse(body.toString())).toEqual({ table: 'CvRequest', id: 'request-1', erasedAt: expect.any(String) });
    expect(contentType).toBe('application/json');
    expect(cacheControl).toBe('no-store');
  });
});
