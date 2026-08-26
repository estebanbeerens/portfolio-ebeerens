import { ImageLoaderConfig } from '@angular/common';

// Mirrors apps/api/src/app/storage/image-derivatives.service.ts's IMAGE_DERIVATIVE_WIDTHS and
// derivativeKey() naming ("-{width}w.webp" before the original extension) - keep both in sync.
export const PROJECT_IMAGE_WIDTHS = [480, 768, 1024, 1600];
export const PROJECT_IMAGE_NG_SRCSET = PROJECT_IMAGE_WIDTHS.map((width) => `${width}w`).join(', ');

export function r2ProjectImageLoader({ src, width }: ImageLoaderConfig): string {
  if (!width) {
    return src;
  }
  const lastDot = src.lastIndexOf('.');
  const base = lastDot === -1 ? src : src.slice(0, lastDot);
  return `${base}-${width}w.webp`;
}
