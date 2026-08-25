# Rich Text: Storage & Sanitization

## Why Markdown, Not HTML or a Structured Document

Markdown source is plain text — easy to author in a plain `<textarea>`, easy to diff/store, and (unlike raw HTML) it doesn't carry executable markup by default. Storing raw HTML from a rich-text editor and trusting it at render time is a stored-XSS risk; storing Markdown and controlling the render pipeline (parser + sanitizer) isn't.

`Project.description`, `Role.description`, and `Profile.bio` are all Markdown source columns authored the same way in admin.

## Editor Side (Admin UI)

No dedicated editor library is needed — a plain `<textarea>` bound to the form control holds the Markdown source directly. Pair it with a live preview pane using `ngx-markdown`'s `MarkdownComponent` so authors can see the rendered result as they type:

```html
<textarea formControlName="description"></textarea>
<markdown [data]="form.controls.description.value" ngPreserveWhitespaces />
```

Persist the raw markdown string to the `String`/`text` column — not any HTML/JSON transformation of it. This admin-side preview is authenticated-only convenience; it is not the public-facing security boundary (see below).

## Rendering For Public Consumption: Server-Side, Not `ngx-markdown`

An earlier version of this app rendered Markdown client-side with `ngx-markdown` in the public `web` app too, relying on Angular's `DomSanitizer` as the XSS defense. That was removed for two reasons: it shipped a Markdown parser (`marked`, plus the `ngx-markdown` runtime) to every visitor's browser for content only ~2 people ever author, and it meant admin-authored Markdown syntax (`**bold**`, `[text](url)`) rendered as literal, unformatted text once the public renderer was simplified — a real regression, not just a bundle-size tradeoff.

The current architecture renders Markdown to sanitized HTML **server-side**, once, in `apps/api/src/app/shared/markdown-render.service.ts` (`MarkdownRenderService`):

```ts
import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import { FilterXSS } from 'xss';

const filter = new FilterXSS({
  whiteList: {
    p: [],
    br: [],
    strong: [],
    em: [],
    a: ['href'],
    ul: [],
    ol: [],
    li: [],
    code: [],
    pre: [],
    blockquote: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
  },
});

@Injectable()
export class MarkdownRenderService {
  render(markdown: string): string {
    const html = marked.parse(markdown) as string;
    return filter.process(html);
  }
}
```

`sanitize-html` was considered but rejected here: its `htmlparser2` dependency ships ESM-only (as do its own transitive deps), which breaks Jest's default CJS module resolution in this repo's test setup. `xss` is plain CommonJS with no such chain, and its default attribute handling already strips `javascript:`/`vbscript:`/`data:` URLs from `href`.

`ProfileService.findPublicPortfolio()` — the single consolidated public endpoint — is the only place this runs: it computes `profile.bioHtml`, `role.descriptionHtml`, and `project.descriptionHtml` from the raw Markdown fields on every call (rendering is cheap and re-run on read, not cached as HTML in Postgres, so there is only one source of truth). Admin's own CRUD read endpoints are untouched and keep returning only the raw Markdown field for editing.

## Where This Runs

- **Public portfolio response (`api`)**: `MarkdownRenderService.render()` is called from `ProfileService.findPublicPortfolio()` for `bio`, each role's `description`, and each project's `description`, adding sibling `bioHtml`/`descriptionHtml` fields to the response.
- **Public web (`web`)**: binds the rendered field directly, e.g. `<div [innerHTML]="project.descriptionHtml"></div>` — no Markdown parser ships to the browser. This still passes through Angular's own `DomSanitizer` (`SecurityContext.HTML`) since the binding is plain `[innerHTML]`, not `bypassSecurityTrustHtml` — defense in depth on top of the server-side sanitization.
- **Admin preview (`admin`)**: unchanged — `ngx-markdown`'s `MarkdownComponent`/`DomSanitizer` renders the live preview pane from the raw Markdown field, authenticated-only.
- Never render the raw stored markdown string as HTML directly via `[innerHTML]`/`bypassSecurityTrustHtml` in `web` — always go through the API's rendered `*Html` field, which already went through `MarkdownRenderService`.
