---
name: image-storage-r2
description: 'Implement image upload/delete via Cloudflare R2 presigned URLs (never proxying file bytes through the API), and store/render TipTap rich-text project descriptions as sanitized ProseMirror JSON. Use when implementing the upload/presign endpoints, wiring the admin image picker, or rendering rich-text project descriptions (including SSR).'
---

# Image Storage (R2) & Rich Text

## When to Use

- Implementing image upload, replace, or delete for a `Project`
- Adding the presigned-upload backend endpoints
- Wiring the TipTap editor in the admin UI, or rendering its stored content anywhere (admin preview, public SSR)

## Why This Is Its Own Skill

Two distinct, security-relevant patterns that don't fit `nestjs-backend`'s generic CRUD workflow: presigned direct-to-storage uploads (the API must never see file bytes), and safely round-tripping rich text stored as structured JSON rather than trusted HTML.

## Image Upload: Presigned URLs (architecture plan §10)

The API only ever issues short-lived, scoped presigned URLs — it never receives or forwards file bytes. See [presigned-uploads.md](./references/presigned-uploads.md) for the full request/response shapes and R2 client setup.

Quick flow:

1. Admin UI asks the API for an upload URL (`POST /api/uploads/presign`), sending the intended content-type/size.
2. API validates the request, presigns a PUT URL against R2, returns it plus the object key.
3. Admin UI uploads the file **directly to R2** using that URL.
4. Admin UI calls a confirm endpoint; the API stores the object key/URL against the `Project` row.

## Rich Text: TipTap → ProseMirror JSON → Sanitized HTML (architecture plan §10)

`Project.description` is a `Json` column (already in [schema.prisma](../../../apps/api/prisma/schema.prisma)) holding a ProseMirror document, not HTML. See [richtext-sanitization.md](./references/richtext-sanitization.md) for the editor/serializer/sanitizer setup.

Quick flow:

1. Admin UI's TipTap editor produces/consumes ProseMirror JSON — store that JSON as-is.
2. At render time (admin preview or public SSR), serialize the JSON to HTML using an **allowlisted** serializer that matches the editor's extension set exactly.
3. Run the serialized HTML through `sanitize-html` (or DOMPurify) as defense in depth before it ever reaches a response.
4. Never accept or store raw HTML from a client directly.

## Reference Files

- [Presigned upload implementation](./references/presigned-uploads.md)
- [Rich text storage & sanitization](./references/richtext-sanitization.md)

## Best Practices Checklist

- The API never proxies file bytes — only presigns URLs
- Content-type/size are validated server-side before a presigned URL is issued, not just client-side
- Presigned URLs expire quickly (minutes, not hours)
- Deleting a project/image deletes the R2 object too, not just the database row
- The rich-text serializer's allowlist and the TipTap editor's extension list are kept in lockstep — an editor feature with no matching serializer support will silently drop or (worse) mis-render content
- Sanitization runs on every render path, not just once at save time
