import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { R2Service } from '../storage/r2.service';

@Injectable()
export class PrivacyErasureService {
  constructor(private readonly r2: R2Service) {}

  async record(table: 'ContactMessage' | 'CvRequest', id: string): Promise<void> {
    const bucket = process.env.R2_BACKUPS_BUCKET;
    if (!bucket || !this.r2.isConfigured) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Privacy erasure storage is unavailable');
      }
      return;
    }
    await this.r2.putObject(
      bucket,
      `erasures/${table}/${encodeURIComponent(id)}.json`,
      Buffer.from(JSON.stringify({ table, id, erasedAt: new Date().toISOString() })),
      'application/json',
      'no-store'
    );
  }
}
