import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeroSection } from './hero-section.component';

describe('HeroSection', () => {
  it('renders plain-text biography and route CTAs when profile data is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSection],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroSection);
    fixture.componentRef.setInput('profile', {
      id: 'profile-1',
      name: 'John Beerens',
      headline: 'Frontend Engineer',
      bio: 'Builds useful interfaces.',
      location: 'Amsterdam, Netherlands',
      updatedAt: '2026-01-01',
    });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toContain('Builds useful interfaces.');
    expect(compiled.querySelector('a[href="/projects"]')?.textContent).toContain('See My Projects');
    expect(compiled.querySelector('a[href="/contact"]')?.textContent).toContain('Get In Touch');
  });
});
