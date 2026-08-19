# Rich Text: Storage & Sanitization

## Why Markdown, Not HTML or a Structured Document

Markdown source is plain text — easy to author in a plain `<textarea>`, easy to diff/store, and (unlike raw HTML) it doesn't carry executable markup by default. Storing raw HTML from a rich-text editor and trusting it at render time is a stored-XSS risk; storing Markdown and controlling the render pipeline (parser + sanitizer) isn't.

## Editor Side (Admin UI)

No dedicated editor library is needed — a plain `<textarea>` bound to the `description` form control holds the Markdown source directly. Pair it with a live preview pane using `ngx-markdown`'s `MarkdownComponent` so authors can see the rendered result as they type:

```html
<textarea formControlName="description"></textarea>
<markdown [data]="form.controls.description.value" ngPreserveWhitespaces />
```

Persist the raw markdown string to `Project.description` (`String`/`text` column) — not any HTML/JSON transformation of it.

## Rendering: `ngx-markdown` (Client + SSR)

```
npm install ngx-markdown marked@^18.0.0
```

Wire it once per app via `provideMarkdown()` in `app.config.ts` (inherited by the SSR `app.config.server.ts` through `mergeApplicationConfig`):

```ts
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [provideMarkdown() /* ...other providers */],
};
```

Then render anywhere (admin preview, public SSR) with the `<markdown [data]="...">` component or `MarkdownService`/`MarkdownPipe`. Since `marked` is plain JS, this renders identically during SSR — no special server-side pipeline is needed.

## Sanitize by Default

`ngx-markdown` sanitizes by default using Angular's `DomSanitizer` with `SecurityContext.HTML`, stripping tags/attributes Angular considers unsafe (script tags, inline event handlers, etc.) before the HTML is bound to the DOM:

```ts
// default — sanitization enabled
provideMarkdown();

// do NOT do this for client-authored content
provideMarkdown({
  sanitize: { provide: SANITIZE, useValue: SecurityContext.NONE },
});
```

Never set `disableSanitizer` on a `<markdown>` binding that renders client-authored (i.e. admin-entered) content. If stricter control is ever needed, `SANITIZE` also accepts a custom sanitize function (e.g. backed by DOMPurify) — but the default Angular sanitizer is the baseline and should stay enabled.

## Where This Runs

- **Public SSR (`web`)**: `provideMarkdown()` is wired into `apps/web/src/app/app.config.ts`; render project descriptions with the `<markdown>` component once that UI is built — this is the highest-stakes render path since it's public and unauthenticated.
- **Admin preview (`admin`)**: same component/config, same sanitizer guarantees — the live preview pane is not a separate, looser rendering path.
- Never render the raw stored markdown string as HTML directly via `[innerHTML]`/`bypassSecurityTrustHtml` — always go through `ngx-markdown`'s pipeline first.
