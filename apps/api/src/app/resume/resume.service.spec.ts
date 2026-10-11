import { ResumeService } from './resume.service';
import { CvContent } from './resume-content.service';

describe('ResumeService', () => {
  const originalBucket = process.env.R2_DOCUMENTS_BUCKET;
  const content: CvContent = {
    locale: 'en',
    name: 'Esteban',
    links: [],
    roles: [],
    education: [],
    projects: [],
    skills: [],
  };
  beforeEach(() => {
    process.env.R2_DOCUMENTS_BUCKET = 'documents';
  });
  afterEach(() => {
    if (originalBucket) process.env.R2_DOCUMENTS_BUCKET = originalBucket;
    else delete process.env.R2_DOCUMENTS_BUCKET;
  });

  function build() {
    const count = jest.fn().mockResolvedValue({});
    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback) => callback({ $executeRaw: jest.fn(), resumeDownload: { create: count } })),
    };
    const r2 = {
      objectExists: jest.fn().mockResolvedValue(false),
      putObject: jest.fn(),
      presignGet: jest.fn().mockResolvedValue('https://download.example/cv.pdf'),
    };
    const source = { snapshot: jest.fn().mockResolvedValue(content) };
    const pdf = { render: jest.fn().mockResolvedValue(Buffer.from('%PDF-')) };
    const requests = { validate: jest.fn().mockResolvedValue(false), record: jest.fn() };
    const service = new ResumeService(prisma as never, r2 as never, source as never, pdf as never, requests as never);
    return { service, prisma, r2, source, pdf, requests, count };
  }

  it('serves cached PDFs without rendering and skips identity records', async () => {
    const { service, r2, pdf, requests, count } = build();
    r2.objectExists.mockResolvedValue(true);
    await expect(service.download('en')).resolves.toMatchObject({ loggingStatus: 'not-requested' });
    expect(pdf.render).not.toHaveBeenCalled();
    expect(requests.record).not.toHaveBeenCalled();
    expect(count).toHaveBeenCalledWith({ data: {} });
  });

  it('coalesces simultaneous generation and signs only after upload', async () => {
    const { service, pdf, r2 } = build();
    await Promise.all([service.download('en'), service.download('en')]);
    expect(pdf.render).toHaveBeenCalledTimes(1);
    expect(r2.putObject).toHaveBeenCalledTimes(1);
    expect(r2.putObject.mock.invocationCallOrder[0]).toBeLessThan(r2.presignGet.mock.invocationCallOrder[0]);
  });

  it('delivers the PDF when optional logging fails', async () => {
    const { service, requests, count } = build();
    requests.validate.mockResolvedValue(true);
    requests.record.mockRejectedValue(new Error('database unavailable'));
    count.mockRejectedValue(new Error('database unavailable'));
    await expect(service.download('en', { fullName: 'Jane', consent: true })).resolves.toEqual({
      downloadUrl: 'https://download.example/cv.pdf',
      loggingStatus: 'failed',
    });
  });

  it('does not log previews', async () => {
    const { service, requests, count } = build();
    await service.preview('en');
    expect(count).not.toHaveBeenCalled();
    expect(requests.record).not.toHaveBeenCalled();
  });

  it('retries failed generation on the next request', async () => {
    const { service, pdf, source } = build();
    pdf.render.mockRejectedValueOnce(new Error('renderer failed'));
    await expect(service.download('en')).rejects.toThrow('CV generation unavailable');
    source.snapshot.mockResolvedValue({ ...content, name: 'Updated' });
    await expect(service.download('en')).resolves.toMatchObject({ loggingStatus: 'not-requested' });
    expect(pdf.render).toHaveBeenCalledTimes(2);
  });

  it('retries when source changes during rendering rather than signing stale content', async () => {
    const { service, source, pdf } = build();
    source.snapshot.mockResolvedValueOnce(content).mockResolvedValue({ ...content, name: 'Updated' });
    await service.download('en');
    expect(pdf.render).toHaveBeenCalledTimes(2);
  });
});
