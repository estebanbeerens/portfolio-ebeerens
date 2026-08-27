import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PortfolioContentService } from '../../shared/portfolio-content.service';
import { axe } from 'vitest-axe';
import { Footer } from './footer.component';

describe('Footer', () => {
  const providers = [
    provideRouter([]),
    { provide: PortfolioContentService, useValue: { resumeEnabled: signal(true) } },
  ];

  it('renders all social links provided by the profile, including Instagram and YouTube', async () => {
    await TestBed.configureTestingModule({ imports: [Footer], providers }).compileComponents();

    const fixture = TestBed.createComponent(Footer);
    fixture.componentRef.setInput('profile', {
      id: 'profile-1',
      name: 'John Beerens',
      githubUrl: 'https://github.com/john',
      linkedinUrl: 'https://linkedin.com/in/john',
      instagramUrl: 'https://instagram.com/john',
      youtubeUrl: 'https://youtube.com/@john',
      xUrl: 'https://x.com/john',
      updatedAt: '2026-01-01',
    });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="https://instagram.com/john"]')?.textContent).toContain('Instagram');
    expect(compiled.querySelector('a[href="https://youtube.com/@john"]')?.textContent).toContain('YouTube');
  });

  it('omits social links that are not provided', async () => {
    await TestBed.configureTestingModule({ imports: [Footer], providers }).compileComponents();

    const fixture = TestBed.createComponent(Footer);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'John Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Instagram');
    expect(text).not.toContain('YouTube');
  });

  it('has no accessibility violations', async () => {
    await TestBed.configureTestingModule({ imports: [Footer], providers }).compileComponents();

    const fixture = TestBed.createComponent(Footer);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'John Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
  });
});
