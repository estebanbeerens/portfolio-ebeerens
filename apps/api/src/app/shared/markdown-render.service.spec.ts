import { MarkdownRenderService } from './markdown-render.service';

describe('MarkdownRenderService', () => {
  const service = new MarkdownRenderService();

  it('renders common Markdown formatting to HTML', () => {
    const html = service.render('# Title\n\nBuilt **accessible** and *fast* interfaces.\n\n- one\n- two');

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>accessible</strong>');
    expect(html).toContain('<em>fast</em>');
    expect(html).toContain('<li>one</li>');
  });

  it('hardens links against dangerous URL schemes', () => {
    const html = service.render('[safe](https://example.com) and [unsafe](javascript:alert(1))');

    expect(html).toContain('<a href="https://example.com">safe</a>');
    expect(html).not.toContain('javascript:');
  });

  it('strips script tags and inline event handlers', () => {
    const html = service.render('Hello <script>alert(1)</script> <img src="x" onerror="alert(1)" />');

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
  });
});
