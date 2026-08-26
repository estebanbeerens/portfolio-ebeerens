import { R2Service } from './r2.service';

describe('R2Service', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('reports configured only when all R2 env vars are present', () => {
    const service = new R2Service();
    expect(service.isConfigured).toBe(true);

    delete process.env.R2_ACCESS_KEY_ID;
    expect(new R2Service().isConfigured).toBe(false);
  });

  it('reads an object body into a Buffer', async () => {
    const service = new R2Service();
    const send = jest.fn().mockResolvedValue({ Body: { transformToByteArray: () => Uint8Array.from([1, 2, 3]) } });
    (service as unknown as { getClient: () => { send: typeof send } }).getClient = () => ({ send });

    const buffer = await service.getObjectBuffer('bucket', 'projects/abc.png');

    expect(buffer).toEqual(Buffer.from([1, 2, 3]));
  });

  it('throws when the object has no body', async () => {
    const service = new R2Service();
    const send = jest.fn().mockResolvedValue({ Body: undefined });
    (service as unknown as { getClient: () => { send: typeof send } }).getClient = () => ({ send });

    await expect(service.getObjectBuffer('bucket', 'projects/abc.png')).rejects.toThrow('has no body');
  });

  it('puts an object with the given content type and cache-control', async () => {
    const service = new R2Service();
    const send = jest.fn().mockResolvedValue({});
    (service as unknown as { getClient: () => { send: typeof send } }).getClient = () => ({ send });

    await service.putObject('bucket', 'projects/abc-480w.webp', Buffer.from('img'), 'image/webp', 'public, max-age=1');

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command.input).toMatchObject({
      Bucket: 'bucket',
      Key: 'projects/abc-480w.webp',
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=1',
    });
  });
});
