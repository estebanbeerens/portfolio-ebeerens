---
name: image-storage-r2
description: 'Implement image upload/delete via Cloudflare R2 presigned URLs (never proxying file bytes through the API), and store/render Markdown-authored content (project descriptions, role descriptions, profile bio) safely. Use when implementing the upload/presign endpoints, wiring the admin markdown editor, or rendering rich-text content for the public app (including SSR).'
---

# Image Storage (R2) & Rich Text

## When to Use

- Implementing image upload, replace, or delete for a `Project`
- Adding the presigned-upload backend endpoints
- Wiring the Markdown editor/preview in the admin UI, or rendering its stored content anywhere (admin preview, public portfolio response)

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

`Project.description`, `Role.description`, and `Profile.bio` are `String`/`text` columns holding raw Markdown source, not HTML or a structured document. See [richtext-sanitization.md](./references/richtext-sanitization.md) for the editor/renderer/sanitizer setup.

Quick flow:

1. Admin UI's plain `<textarea>` holds the Markdown source directly — store that string as-is (no JSON encoding/parsing).
2. Admin's own live preview renders the Markdown client-side with `ngx-markdown`'s `MarkdownComponent`/`MarkdownService` (`marked` under the hood) — this is an authenticated-only convenience, not the public-facing defense.
3. The **public** portfolio response (`ProfileService.findPublicPortfolio()`) renders Markdown to sanitized HTML **server-side**, via `MarkdownRenderService` (`marked` + the `xss` package), exposing it as a sibling `*Html` field (`descriptionHtml`, `bioHtml`) alongside the raw Markdown field. This keeps a Markdown parser out of the public browser bundle — `web` only ever binds the pre-sanitized HTML via `[innerHTML]` (still passing through Angular's own `DomSanitizer` as defense in depth).
4. Never accept or store raw HTML from a client directly, and never bypass Angular's sanitizer (`bypassSecurityTrustHtml`) for this content.

## Reference Files

- [Presigned upload implementation](./references/presigned-uploads.md)
- [Rich text storage & sanitization](./references/richtext-sanitization.md)

## Best Practices Checklist

- The API never proxies file bytes — only presigns URLs
- Content-type/size are validated server-side before a presigned URL is issued, not just client-side
- Presigned URLs expire quickly (minutes, not hours)
- Deleting a project/image deletes the R2 object too, not just the database row
- The public portfolio response's `MarkdownRenderService` sanitization stays enabled on every render path — never expose an unsanitized Markdown-derived HTML field to the public app
- Sanitization runs on every render (Markdown is re-rendered on read, not cached as HTML in the database), not just once at save time
- `web` binds rendered content via `[innerHTML]`, never `bypassSecurityTrustHtml`, so Angular's own sanitizer still applies as defense in depth
