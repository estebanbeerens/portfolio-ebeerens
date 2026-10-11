import { CvContent } from './resume-content.service';
import { ResumePdfService } from './resume-pdf.service';
import sharp from 'sharp';

describe('ResumePdfService', () => {
  const content: CvContent = {
    locale: 'en',
    name: 'Zo\u00eb Beerens',
    bio: '**Developer**\n\n- Accessible software\n- [Portfolio](https://ebeerens.com)\n\n<script>bad()</script>',
    links: [],
    roles: [],
    education: [],
    projects: [],
    skills: [{ name: 'Frontend', skills: ['Angular'] }],
  };

  it('renders a real PDF with packaged local fonts', async () => {
    const pdf = await new ResumePdfService().render(content);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it.each(['en', 'nl'] as const)('keeps only the name and page numbers in the footer (%s)', async (locale) => {
    const sample = { ...content, locale, links: [{ label: 'Portfolio', url: 'https://portfolio.example/' }] };
    const service = new ResumePdfService();
    const definition = service.definition(sample);
    const footer =
      typeof definition.footer === 'function'
        ? definition.footer(1, 2, { width: 595, height: 842, orientation: 'portrait' })
        : undefined;
    expect(footer).toMatchObject({ text: `${content.name} | 1 / 2`, fontSize: 8 });
    expect(JSON.stringify(footer)).not.toContain('https://portfolio.example/');
    expect(footer).not.toHaveProperty('stack');
    expect((await service.render(sample)).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('groups employers, separates the introduction, links project titles and places skills before experience', async () => {
    const entry = {
      heading: 'Developer',
      organization: 'Employer',
      employerId: 'employer-1',
      period: '2025 - present',
      skills: ['Angular'],
    };
    const sample: CvContent = {
      ...content,
      roles: [entry, { ...entry, heading: 'Engineer' }],
      projects: [
        {
          heading: 'Portfolio project',
          period: '2024',
          skills: ['Angular'],
          pageUrl: 'https://ebeerens.com/en/projects/portfolio',
          url: 'https://live.example/',
        },
      ],
    };
    const service = new ResumePdfService();
    const definition = service.definition(sample);
    const nodes = definition.content as unknown as {
      text?: string;
      columns?: { text?: string }[];
      canvas?: unknown;
      stack?: { text?: string; link?: string }[];
    }[];
    expect(
      nodes.filter(
        (node) =>
          Array.isArray(node.columns) && node.columns.some((column: { text?: string }) => column.text === 'Employer')
      )
    ).toHaveLength(1);
    expect(nodes.find((node) => node.canvas)).toMatchObject({ margin: [0, 6, 0, 6] });
    expect(definition.defaultStyle).toMatchObject({ fontSize: 10, lineHeight: 1.1 });
    const projectHeader = nodes.find((node) => Array.isArray(node.stack) && node.stack[0].text === 'Portfolio project');
    expect(projectHeader?.stack).toEqual(
      expect.arrayContaining([expect.objectContaining({ link: 'https://ebeerens.com/en/projects/portfolio' })])
    );
    expect(JSON.stringify(nodes)).toContain('Live URL: ');
    const skillsIndex = nodes.findIndex((node) => node.text === 'Skills');
    const experienceIndex = nodes.findIndex((node) => node.text === 'Experience');
    expect(skillsIndex).toBeGreaterThan(nodes.findIndex((node) => node.canvas));
    expect(experienceIndex).toBe(skillsIndex + 2);
    expect(nodes.filter((node) => node.text === 'Angular')).toHaveLength(0);
    expect(nodes[skillsIndex + 1].stack).toEqual([
      { text: 'Frontend', style: 'entry', margin: [0, 0, 0, 3] },
      { text: 'Angular' },
    ]);
    expect((await service.render(sample)).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('omits raw HTML and empty sections, and renders structured Markdown', () => {
    const definition = JSON.stringify(new ResumePdfService().definition(content));
    expect(definition).toContain('Developer');
    expect(definition).toContain('https://ebeerens.com/');
    expect(definition).not.toContain('bad()');
    expect(definition).not.toContain('Highlighted Projects');
  });

  it('renders text-only employers and underlines every clickable link', async () => {
    const sample: CvContent = {
      ...content,
      links: [{ label: 'GitHub', url: 'https://github.com/example' }],
      roles: [{ heading: 'Developer', organization: 'Employer', employerId: '1', period: '2025', skills: [] }],
      projects: [
        {
          heading: 'Project',
          period: '2024',
          skills: [],
          pageUrl: 'https://ebeerens.com/en/projects/project',
          url: 'https://live.example/',
        },
      ],
    };
    const definition = new ResumePdfService().definition(sample);
    let linkCount = 0;
    const checkLinks = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(checkLinks);
      else if (node && typeof node === 'object') {
        if ('link' in node && typeof node.link === 'string') {
          expect(node).toMatchObject({ decoration: 'underline' });
          linkCount++;
        }
        Object.values(node).forEach(checkLinks);
      }
    };
    checkLinks(definition.content);
    expect(linkCount).toBe(4);
    expect(JSON.stringify(definition.content)).not.toContain('"image"');
    const pdf = await new ResumePdfService().render(sample);
    expect(pdf.toString('latin1')).not.toMatch(/\/Subtype\s*\/Image/);
  });

  it('embeds a circular GitHub portrait in the right-hand header column', async () => {
    const source = await sharp({ create: { width: 32, height: 48, channels: 3, background: '#ff0000' } })
      .png()
      .toBuffer();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array(source)));
    try {
      const service = new ResumePdfService();
      const definition = jest.spyOn(service, 'definition');
      const pdf = await service.render({ ...content, avatarUrl: 'https://avatars.githubusercontent.com/u/123?s=256' });
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      const avatar = definition.mock.calls[0][1] as string;
      const { data, info } = await sharp(Buffer.from(avatar.split(',')[1], 'base64'))
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(info.width).toBe(256);
      expect(info.height).toBe(256);
      expect(data[3]).toBe(0);
      expect(data[(128 * 256 + 128) * 4 + 3]).toBe(255);
      const header = (service.definition(content, avatar).content as { columns: unknown[] }[])[0];
      expect(header.columns[1]).toMatchObject({ image: avatar, width: 88, height: 88, alignment: 'right' });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://avatars.githubusercontent.com/u/123?s=256',
        expect.objectContaining({ redirect: 'error' })
      );
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('does not fetch arbitrary remote avatar URLs', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    try {
      await expect(new ResumePdfService().render({ ...content, avatarUrl: 'http://127.0.0.1/image' })).rejects.toThrow(
        'Unsupported CV avatar URL'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('rejects failed avatar requests and oversized images rather than caching an incomplete CV', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(new Uint8Array(2 * 1024 * 1024 + 1)));
    try {
      const service = new ResumePdfService();
      const withAvatar = { ...content, avatarUrl: 'https://avatars.githubusercontent.com/u/123?s=256' };
      await expect(service.render(withAvatar)).rejects.toThrow('GitHub avatar unavailable');
      await expect(service.render(withAvatar)).rejects.toThrow('GitHub avatar is too large');
    } finally {
      fetchMock.mockRestore();
    }
  });
});
