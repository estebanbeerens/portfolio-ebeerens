# Rich Text: Storage & Sanitization

## Why JSON, Not HTML
A ProseMirror/TipTap document is a structured tree of known node/mark types — it cannot smuggle an arbitrary `<script>` tag or `onclick` attribute the way a free-form HTML string can. Storing raw HTML from a rich-text editor and trusting it at render time is a stored-XSS risk; storing the structured document and controlling serialization server-side isn't.

## Editor Side (Admin UI, TipTap)
```
npm install @tiptap/core @tiptap/starter-kit @tiptap/angular
```
Use an **explicit** extension list — don't reach for a kitchen-sink config:
```ts
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';

const extensions = [StarterKit, Link.configure({ openOnClick: false })];
```
Persist `editor.getJSON()` (the ProseMirror document) to the `Project.description` field — not `editor.getHTML()`.

## Server-Side Serialization
Use the **same extension list** on the server to turn the stored JSON back into HTML, via `@tiptap/html`'s `generateHTML`:
```
npm install @tiptap/html
```
```ts
import { generateHTML } from '@tiptap/html';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';

const extensions = [StarterKit, Link.configure({ openOnClick: false })]; // must match the editor's list

function renderDescription(doc: unknown): string {
  return generateHTML(doc as JSONContent, extensions);
}
```
If the editor's extension list and this list drift apart, content created with a newer editor extension either fails to serialize or serializes incorrectly — keep them in one shared location (e.g. a small shared constant) rather than duplicating the array in both places.

## Sanitize as Defense in Depth
Even though `generateHTML` only emits tags from the known extension set, run the result through `sanitize-html` before it reaches any response — a bug in the serializer or an extension misconfiguration shouldn't be the only thing standing between stored content and the rendered page:
```
npm install sanitize-html
npm install -D @types/sanitize-html
```
```ts
import sanitizeHtml from 'sanitize-html';

function safeRenderDescription(doc: unknown): string {
  const html = generateHTML(doc as JSONContent, extensions);
  return sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote', 'code'],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
  });
}
```
Keep `allowedTags`/`allowedAttributes` a subset of (or equal to) what the TipTap extension list can actually produce.

## Where This Runs
- **Public SSR (`web`)**: call `safeRenderDescription()` server-side before the page is sent — this is the highest-stakes render path since it's public and unauthenticated.
- **Admin preview (`admin`)**: same function, same guarantees — don't build a second, looser rendering path "just for preview."
- Never render the raw stored JSON as HTML directly in a template with `[innerHTML]`/`bypassSecurityTrustHtml` without going through this pipeline first.
