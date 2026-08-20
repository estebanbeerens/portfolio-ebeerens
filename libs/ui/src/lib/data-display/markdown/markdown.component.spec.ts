import { TestBed } from '@angular/core/testing';
import { provideMarkdown } from 'ngx-markdown';
import { Markdown } from './markdown.component';

describe('Markdown', () => {
  it('renders supplied Markdown source through ngx-markdown', async () => {
    await TestBed.configureTestingModule({
      imports: [Markdown],
      providers: [provideMarkdown()],
    }).compileComponents();

    const fixture = TestBed.createComponent(Markdown);
    fixture.componentRef.setInput('source', 'Hello **portfolio**');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).innerHTML).toContain('<strong>portfolio</strong>');
  });

  it('does not render unsafe HTML attributes', async () => {
    await TestBed.configureTestingModule({
      imports: [Markdown],
      providers: [provideMarkdown()],
    }).compileComponents();

    const fixture = TestBed.createComponent(Markdown);
    fixture.componentRef.setInput('source', '<img src="x" onerror="alert(1)">');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).innerHTML).not.toContain('onerror');
  });
});
