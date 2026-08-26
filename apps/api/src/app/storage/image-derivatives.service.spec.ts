jest.mock('sharp', () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('derivative')),
  }))
);

import { derivativeKey, IMAGE_DERIVATIVE_WIDTHS, ImageDerivativesService } from './image-derivatives.service';
import { R2Service } from './r2.service';

describe('derivativeKey', () => {
  it('inserts the width before the original extension', () => {
    expect(derivativeKey('projects/abc123.png', 480)).toBe('projects/abc123-480w.webp');
  });

  it('appends the suffix when the key has no extension', () => {
    expect(derivativeKey('projects/abc123', 480)).toBe('projects/abc123-480w.webp');
  });
});

describe('ImageDerivativesService', () => {
  function build(isConfigured = true) {
    const r2 = {
      isConfigured,
      getObjectBuffer: jest.fn().mockResolvedValue(Buffer.from('original')),
      putObject: jest.fn(),
      deleteObject: jest.fn(),
    };
    return { service: new ImageDerivativesService(r2 as unknown as R2Service), r2 };
  }

  it('generates a derivative for every configured width', async () => {
    const { service, r2 } = build();
    await service.generate('bucket', 'projects/abc123.png');

    expect(r2.putObject).toHaveBeenCalledTimes(IMAGE_DERIVATIVE_WIDTHS.length);
    expect(r2.putObject).toHaveBeenCalledWith(
      'bucket',
      'projects/abc123-480w.webp',
      expect.any(Buffer),
      'image/webp',
      'public, max-age=31536000, immutable'
    );
  });

  it('skips generation when R2 is not configured', async () => {
    const { service, r2 } = build(false);
    await service.generate('bucket', 'projects/abc123.png');

    expect(r2.getObjectBuffer).not.toHaveBeenCalled();
  });

  it('does not throw when generation fails', async () => {
    const { service, r2 } = build();
    r2.getObjectBuffer.mockRejectedValue(new Error('boom'));

    await expect(service.generate('bucket', 'projects/abc123.png')).resolves.toBeUndefined();
  });

  it('deletes every derivative width', async () => {
    const { service, r2 } = build();
    await service.delete('bucket', 'projects/abc123.png');

    expect(r2.deleteObject).toHaveBeenCalledTimes(IMAGE_DERIVATIVE_WIDTHS.length);
    expect(r2.deleteObject).toHaveBeenCalledWith('bucket', 'projects/abc123-480w.webp');
  });
});
