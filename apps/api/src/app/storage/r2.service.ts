import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

  async deleteObject(bucket: string, objectKey: string) {
    await this.getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  }

  // Lazily built so the API still boots (and the non-R2 routes still work) without credentials.
  private getClient(): S3Client {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }
    this.client ??= new S3Client({
      region: 'auto',
      endpoint: this.endpoint(),
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
      // AWS SDK v3's default flexible-checksum behavior embeds `x-amz-checksum-*`/
      // `x-amz-sdk-checksum-algorithm` query params in presigned URLs. R2 doesn't support that
      // extension, and its error response for it omits CORS headers, so browsers report the
      // failure as a CORS error rather than the underlying checksum mismatch. Opt back out to
      // the pre-3.729 behavior so presigned PUT/GET URLs stay plain SigV4.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
    return this.client;
  }

  // Buckets created under a data-residency jurisdiction (e.g. EU) live at a jurisdiction-specific
  // endpoint and are unreachable at the default one — see architecture doc §10.
  private endpoint(): string {
    const jurisdiction = process.env.R2_JURISDICTION?.trim();
    return jurisdiction
      ? `https://${process.env.R2_ACCOUNT_ID}.${jurisdiction}.r2.cloudflarestorage.com`
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
}
