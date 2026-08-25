import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import { FilterXSS } from 'xss';

// `xss`'s default attribute handling already strips javascript:/vbscript:/data: URLs from href.
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
  // The only public-facing defense against admin-authored Markdown carrying executable markup.
  render(markdown: string): string {
    const html = marked.parse(markdown) as string;
    return filter.process(html);
  }
}
