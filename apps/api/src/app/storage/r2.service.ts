import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGN_TTL_SECONDS = 300;

@Injectable()
export class R2Service {
  private client?: S3Client;

  get isConfigured(): boolean {
    return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  }

  async presignPut(bucket: string, objectKey: string, contentType: string, contentLength: number) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: contentLength,
    });
    return getSignedUrl(this.getClient(), command, { expiresIn: PRESIGN_TTL_SECONDS });
  }

  async presignGet(bucket: string, objectKey: string, downloadFileName?: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ResponseContentDisposition: downloadFileName
        ? `attachment; filename="${downloadFileName.replace(/"/g, '')}"`
        : undefined,
    });
    return getSignedUrl(this.getClient(), command, { expiresIn: PRESIGN_TTL_SECONDS });
  }

  // Lazily built so the API still boots (and the non-R2 routes still work) without credentials.
  private getClient(): S3Client {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }
    this.client ??= new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
    return this.client;
  }
}
