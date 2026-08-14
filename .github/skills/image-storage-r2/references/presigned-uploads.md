# Presigned Upload Implementation (Cloudflare R2)

## R2 Client Setup
R2 is S3-compatible — use the AWS SDK v3 pointed at R2's endpoint:
```
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```
```ts
import { S3Client } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

## Presign Endpoint
```ts
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class PresignUploadDto {
  @IsString()
  @Matches(/^image\/(png|jpeg|webp)$/)
  contentType: string;

  @IsInt()
  @Max(5 * 1024 * 1024) // 5MB
  contentLength: number;
}

@Post('presign')
async presignUpload(@Body() dto: PresignUploadDto) {
  const objectKey = `projects/${randomUUID()}`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_IMAGES_BUCKET,
    Key: objectKey,
    ContentType: dto.contentType,
    ContentLength: dto.contentLength,
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 }); // 5 minutes
  return { uploadUrl, objectKey };
}
```
- Validate `contentType` against an explicit allowlist (image types only) and enforce a max size — both server-side, even though the admin UI should also check client-side.
- Keep the presigned URL's `expiresIn` short; it's a one-time-use credential in practice.

## Confirm Endpoint
```ts
@Patch(':id/image')
async confirmImage(@Param('id') id: string, @Body() { objectKey }: ConfirmImageDto) {
  const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${objectKey}`;
  return this.projectsService.updateImage(id, publicUrl, objectKey);
}
```
Store both the object key (needed to delete later) and the public URL (needed to render) on the `Project` row.

## Delete Flow
```ts
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

async deleteImage(objectKey: string) {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_IMAGES_BUCKET,
    Key: objectKey,
  }));
}
```
Call this whenever a project's image is replaced or the project itself is deleted — an orphaned R2 object left behind on every delete/replace will slowly consume the free tier's storage quota.

## Frontend Upload
```ts
async function uploadImage(file: File, uploadUrl: string) {
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
}
```
This is a direct browser → R2 request — it does not go through the NestJS API. Use the plain `fetch` API here, not the generated OpenAPI client (the client only covers your own API's endpoints, not the presigned R2 URL).
