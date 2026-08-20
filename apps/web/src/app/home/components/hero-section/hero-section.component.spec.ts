import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { HeroSection } from './hero-section.component';

describe('HeroSection', () => {
  it('renders markdown biography and route CTAs when profile data is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSection],
      providers: [provideMarkdown(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroSection);
    fixture.componentRef.setInput('profile', {
      id: 'profile-1',
      name: 'Erwin Beerens',
      headline: 'Frontend Engineer',
      bio: '**Builds** useful interfaces.',
      location: 'Amsterdam, Netherlands',
      updatedAt: '2026-01-01',
    });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('strong')?.textContent).toBe('Builds');
    expect(compiled.querySelector('a[href="/projects"]')?.textContent).toContain('See My Projects');
    expect(compiled.querySelector('a[href="/contact"]')?.textContent).toContain('Get In Touch');
  });
});
