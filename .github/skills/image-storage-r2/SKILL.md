---
name: image-storage-r2
description: 'Implement image upload/delete via Cloudflare R2 presigned URLs (never proxying file bytes through the API), and store/render Markdown project descriptions safely. Use when implementing the upload/presign endpoints, wiring the admin markdown editor, or rendering rich-text project descriptions (including SSR).'
---

# Image Storage (R2) & Rich Text

## When to Use

- Implementing image upload, replace, or delete for a `Project`
- Adding the presigned-upload backend endpoints
- Wiring the Markdown editor/preview in the admin UI, or rendering its stored content anywhere (admin preview, public SSR)

## Why This Is Its Own Skill

Two distinct, security-relevant patterns that don't fit `nestjs-backend`'s generic CRUD workflow: presigned direct-to-storage uploads (the API must never see file bytes), and safely rendering user-authored Markdown rather than trusting raw HTML.

## Image Upload: Presigned URLs (architecture plan §10)

The API only ever issues short-lived, scoped presigned URLs — it never receives or forwards file bytes. See [presigned-uploads.md](./references/presigned-uploads.md) for the full request/response shapes and R2 client setup.

Quick flow:

1. Admin UI asks the API for an upload URL (`POST /api/uploads/presign`), sending the intended content-type/size.
2. API validates the request, presigns a PUT URL against R2, returns it plus the object key.
3. Admin UI uploads the file **directly to R2** using that URL.
4. Admin UI calls a confirm endpoint; the API stores the object key/URL against the `Project` row.

## Rich Text: Markdown → Sanitized HTML (architecture plan §10)

`Project.description` is a `String`/`text` column holding raw Markdown source, not HTML or a structured document. See [richtext-sanitization.md](./references/richtext-sanitization.md) for the editor/renderer/sanitizer setup.

Quick flow:

1. Admin UI's plain `<textarea>` holds the Markdown source directly — store that string as-is (no JSON encoding/parsing).
2. At render time (admin live preview or public SSR), render the Markdown with `ngx-markdown`'s `MarkdownComponent`/`MarkdownService` (`marked` under the hood).
3. Rely on `ngx-markdown`'s default `SANITIZE` provider (Angular `DomSanitizer`, `SecurityContext.HTML`) to strip disallowed tags/attributes — this is the primary XSS defense for markdown-authored content.
4. Never accept or store raw HTML from a client directly, and never bypass the sanitizer (`disableSanitizer`) for user-authored content.

## Reference Files

- [Presigned upload implementation](./references/presigned-uploads.md)
- [Rich text storage & sanitization](./references/richtext-sanitization.md)

## Best Practices Checklist

- The API never proxies file bytes — only presigns URLs
- Content-type/size are validated server-side before a presigned URL is issued, not just client-side
- Presigned URLs expire quickly (minutes, not hours)
- Deleting a project/image deletes the R2 object too, not just the database row
- The rich-text renderer's sanitizer stays enabled on every render path — don't set `disableSanitizer`/`SecurityContext.NONE` for content that came from a client
- Sanitization runs on every render path, not just once at save time
