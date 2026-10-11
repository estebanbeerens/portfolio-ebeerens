import { Injectable } from '@nestjs/common';
import { marked, Token } from 'marked';
import PdfPrinter from 'pdfmake';
import * as virtualFonts from 'pdfmake/build/vfs_fonts';
import sharp from 'sharp';
import { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { CvContent, CvEntry } from './resume-content.service';

function safeLink(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:', 'mailto:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

function inline(tokens: Token[]): ContentText[] {
  return tokens.flatMap((token): ContentText[] => {
    switch (token.type) {
      case 'strong':
        return [{ text: inline(token.tokens), bold: true }];
      case 'em':
        return [{ text: inline(token.tokens), italics: true }];
      case 'del':
        return [{ text: inline(token.tokens), decoration: 'lineThrough' }];
      case 'link':
        return [{ text: inline(token.tokens), link: safeLink(token.href), color: '#00636d', decoration: 'underline' }];
      case 'br':
        return [{ text: '\n' }];
      case 'html':
        return [];
      case 'image':
        return [{ text: token.text || '' }];
      default:
        return [{ text: 'text' in token ? token.text || '' : '' }];
    }
  });
}

function markdownBlocks(source?: string): Content[] {
  if (!source) return [];
  return marked.lexer(source).flatMap((token): Content[] => {
    switch (token.type) {
      case 'heading':
        return [{ text: inline(token.tokens), bold: true, margin: [0, 6, 0, 3] }];
      case 'paragraph':
        return [{ text: inline(token.tokens), margin: [0, 0, 0, 5] }];
      case 'list': {
        const items = token.items.map((item: { text: string }) => ({ stack: markdownBlocks(item.text) }));
        return [token.ordered ? { ol: items, margin: [0, 0, 0, 5] } : { ul: items, margin: [0, 0, 0, 5] }];
      }
      case 'blockquote':
        return [{ stack: markdownBlocks(token.text), margin: [10, 0, 0, 5], italics: true }];
      case 'code':
        return [{ text: token.text, fontSize: 9, margin: [0, 0, 0, 5] }];
      case 'table':
        return [
          {
            table: {
              headerRows: 1,
              widths: token.header.map(() => '*'),
              body: [
                token.header.map((cell: { tokens: Token[] }) => ({ text: inline(cell.tokens), bold: true })),
                ...token.rows.map((row: { tokens: Token[] }[]) => row.map((cell) => ({ text: inline(cell.tokens) }))),
              ],
            },
            margin: [0, 0, 0, 5],
          },
        ];
      default:
        return [];
    }
  });
}

@Injectable()
export class ResumePdfService {
  definition(content: CvContent, avatar?: string): TDocumentDefinitions {
    const dutch = content.locale === 'nl';
    const sections = (title: string, entries: CvEntry[]): Content[] =>
      entries.length
        ? [
            { text: title, style: 'section', headlineLevel: 1 },
            ...entries.flatMap((entry): Content[] => [
              {
                stack: [
                  {
                    text: entry.heading,
                    style: 'entry',
                    link: entry.pageUrl ? safeLink(entry.pageUrl) : undefined,
                    decoration: entry.pageUrl ? 'underline' : undefined,
                    color: entry.pageUrl ? '#00636d' : undefined,
                  },
                  {
                    text: [entry.organization, entry.details, entry.period].filter(Boolean).join(' | '),
                    color: '#48575a',
                    margin: [0, 2, 0, 5],
                  },
                ],
                unbreakable: true,
              },
              ...markdownBlocks(entry.description),
              ...(entry.url
                ? [
                    {
                      text: [
                        { text: 'Live URL: ', color: '#48575a' },
                        { text: entry.url, link: safeLink(entry.url), color: '#00636d', decoration: 'underline' },
                      ],
                      margin: [0, 0, 0, 5],
                    } as Content,
                  ]
                : []),
              { text: ' ', fontSize: 4 },
            ]),
          ]
        : [];
    const employers = new Map<string, { name: string; roles: CvEntry[] }>();
    for (const role of content.roles) {
      const key = role.employerId || role.organization || role.heading;
      const employer = employers.get(key);
      if (employer) employer.roles.push(role);
      else employers.set(key, { name: role.organization || '', roles: [role] });
    }
    const experience: Content[] = content.roles.length
      ? [
          { text: dutch ? 'Werkervaring' : 'Experience', style: 'section', headlineLevel: 1 },
          ...[...employers.values()].flatMap((employer): Content[] => [
            {
              columns: [{ text: employer.name, fontSize: 13, bold: true, width: '*' }],
              columnGap: 10,
              margin: [0, 8, 0, 6],
              headlineLevel: 1,
            },
            ...sections(
              'roles',
              employer.roles.map((role) => ({ ...role, organization: undefined }))
            ).slice(1),
          ]),
        ]
      : [];
    return {
      pageSize: 'A4',
      pageMargins: [42, 42, 42, 48],
      defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.1, color: '#172629' },
      info: {
        title: `${content.name} - CV (${content.locale})`,
        author: content.name,
        subject: 'Curriculum vitae',
        creator: 'Portfolio',
      },
      styles: {
        section: { fontSize: 15, bold: true, color: '#00636d', margin: [0, 15, 0, 8] },
        entry: { fontSize: 11, bold: true },
      },
      footer: (page, pages) => ({
        text: `${content.name} | ${page} / ${pages}`,
        alignment: 'center',
        fontSize: 8,
        color: '#48575a',
        margin: [42, 10, 42, 0],
      }),
      pageBreakBefore: (node, following) => node.headlineLevel === 1 && following.length === 0,
      content: [
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: content.name, fontSize: 27, bold: true, margin: [0, 0, 0, 5] },
                ...(content.headline
                  ? [{ text: content.headline, fontSize: 13, margin: [0, 0, 0, 5] } as Content]
                  : []),
                ...(content.location
                  ? [{ text: content.location, color: '#48575a', margin: [0, 0, 0, 5] } as Content]
                  : []),
                {
                  text: content.links.flatMap((link, index) => [
                    ...(index ? [{ text: ' | ' }] : []),
                    { text: link.label, link: safeLink(link.url), color: '#00636d', decoration: 'underline' as const },
                  ]),
                },
              ],
            },
            ...(avatar ? [{ image: avatar, width: 88, height: 88, alignment: 'right' } as Content] : []),
          ],
          columnGap: 20,
          margin: [0, 0, 0, 12],
        },
        ...markdownBlocks(content.bio),
        ...(content.bio
          ? [
              {
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 511.28, y2: 0, lineWidth: 0.5, lineColor: '#cbd5d1' }],
                margin: [0, 6, 0, 6],
              } as Content,
            ]
          : []),
        ...(content.skills.length
          ? [
              { text: dutch ? 'Vaardigheden' : 'Skills', style: 'section', headlineLevel: 1 },
              ...content.skills.map((category): Content => ({
                stack: [
                  { text: category.name, style: 'entry', margin: [0, 0, 0, 3] },
                  { text: category.skills.join(' / ') },
                ],
                margin: [0, 0, 0, 8],
                unbreakable: true,
              })),
            ]
          : []),
        ...experience,
        ...sections(dutch ? 'Opleiding' : 'Education', content.education),
        ...sections(dutch ? 'Uitgelichte projecten' : 'Highlighted Projects', content.projects),
      ],
    };
  }

  async render(content: CvContent): Promise<Buffer> {
    const avatar = content.avatarUrl ? await this.loadAvatar(content.avatarUrl) : undefined;
    const fonts = virtualFonts as unknown as Record<string, string>;
    const font = (name: string) => Buffer.from(fonts[name], 'base64');
    const printer = new PdfPrinter({
      Roboto: {
        normal: font('Roboto-Regular.ttf'),
        bold: font('Roboto-Medium.ttf'),
        italics: font('Roboto-Italic.ttf'),
        bolditalics: font('Roboto-MediumItalic.ttf'),
      },
    });
    const document = printer.createPdfKitDocument(this.definition(content, avatar));
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.end();
    });
  }

  private async loadAvatar(source: string): Promise<string> {
    const url = new URL(source);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'avatars.githubusercontent.com' ||
      url.port ||
      url.username ||
      url.password
    ) {
      throw new Error('Unsupported CV avatar URL');
    }
    const response = await fetch(url.href, { signal: AbortSignal.timeout(5000), redirect: 'error' });
    if (!response.ok || !response.body) throw new Error('GitHub avatar unavailable');
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        size += result.value.byteLength;
        if (size > 2 * 1024 * 1024) throw new Error('GitHub avatar is too large');
        chunks.push(Buffer.from(result.value));
      }
    } finally {
      await reader.cancel();
    }
    const image = await sharp(Buffer.concat(chunks), { limitInputPixels: 16000000 })
      .resize(256, 256, { fit: 'cover' })
      .ensureAlpha()
      .composite([
        {
          input: Buffer.from('<svg width="256" height="256"><circle cx="128" cy="128" r="128" fill="white"/></svg>'),
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();
    return `data:image/png;base64,${image.toString('base64')}`;
  }
}
