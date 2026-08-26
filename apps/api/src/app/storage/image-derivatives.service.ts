import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { R2Service } from './r2.service';

// Fixed derivative set covering project-card thumbnails through the full-bleed project-detail hero.
// `web`'s R2 image loader (apps/web/src/app/shared/r2-image-loader.ts) mirrors this width list and
// the `derivativeKey` naming below - keep both in sync if either changes.
export const IMAGE_DERIVATIVE_WIDTHS = [480, 768, 1024, 1600] as const;

// `-{width}w.webp` appended before the original extension. The original object key already embeds
// a random UUID per upload, so a new upload naturally gets new derivative URLs - no separate
// version/hash segment or database column is needed to bust stale caches on replacement.
export function derivativeKey(objectKey: string, width: number): string {
  const lastDot = objectKey.lastIndexOf('.');
  const base = lastDot === -1 ? objectKey : objectKey.slice(0, lastDot);
  return `${base}-${width}w.webp`;
}

@Injectable()
export class ImageDerivativesService {
  private readonly logger = new Logger(ImageDerivativesService.name);

  constructor(private readonly r2: R2Service) {}

  // Best-effort and synchronous: runs inline during the admin's create/update call, matching this
  // app's upload frequency (a handful of times a year). A failure here must not fail the mutation.
  async generate(bucket: string, objectKey: string): Promise<void> {
    if (!this.r2.isConfigured) {
      return;
    }
    try {
      const original = await this.r2.getObjectBuffer(bucket, objectKey);
      await Promise.all(
        IMAGE_DERIVATIVE_WIDTHS.map(async (width) => {
          const derivative = await sharp(original)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          await this.r2.putObject(
            bucket,
            derivativeKey(objectKey, width),
            derivative,
            'image/webp',
            'public, max-age=31536000, immutable'
          );
        })
      );
    } catch (error) {
      this.logger.warn(`Failed to generate image derivatives for "${objectKey}": ${error}`);
    }
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    if (!this.r2.isConfigured) {
      return;
    }
    await Promise.all(
      IMAGE_DERIVATIVE_WIDTHS.map(async (width) => {
        try {
          await this.r2.deleteObject(bucket, derivativeKey(objectKey, width));
        } catch (error) {
          this.logger.warn(`Failed to delete image derivative for "${objectKey}" at ${width}w: ${error}`);
        }
      })
    );
  }
}
