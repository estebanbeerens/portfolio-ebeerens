import { TestBed } from '@angular/core/testing';
import { BasicInfoCard } from './basic-info-card.component';

describe('BasicInfoCard', () => {
  it('renders provided basic info without shortening the location', async () => {
    await TestBed.configureTestingModule({ imports: [BasicInfoCard] }).compileComponents();

    const fixture = TestBed.createComponent(BasicInfoCard);
    fixture.componentRef.setInput('profile', {
      id: 'profile-1',
      name: 'John Beerens',
      headline: 'Frontend Engineer',
      location: 'Amsterdam, Netherlands',
      updatedAt: '2026-01-01',
    });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('John Beerens');
    expect(text).toContain('Frontend Engineer');
    expect(text).toContain('Amsterdam, Netherlands');
  });

  it('does not render absent optional profile fields', async () => {
    await TestBed.configureTestingModule({ imports: [BasicInfoCard] }).compileComponents();

    const fixture = TestBed.createComponent(BasicInfoCard);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'John Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Frontend Engineer');
    expect(text).not.toContain('Netherlands');
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
  });

  it('renders clickable icon links for each provided social profile', async () => {
    await TestBed.configureTestingModule({ imports: [BasicInfoCard] }).compileComponents();

    const fixture = TestBed.createComponent(BasicInfoCard);
    fixture.componentRef.setInput('profile', {
      id: 'profile-1',
      name: 'John Beerens',
      githubUrl: 'https://github.com/john',
      linkedinUrl: 'https://linkedin.com/in/john',
      updatedAt: '2026-01-01',
    });
    await fixture.whenStable();

    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('https://github.com/john');
    expect(links[0].getAttribute('aria-label')).toBe('GitHub profile');
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[1].getAttribute('href')).toBe('https://linkedin.com/in/john');
  });
});
