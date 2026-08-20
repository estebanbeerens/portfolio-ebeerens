import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header.component';

describe('Header', () => {
  it('renders the profile name from basic info and route links', async () => {
    await TestBed.configureTestingModule({ imports: [Header], providers: [provideRouter([])] }).compileComponents();

    const fixture = TestBed.createComponent(Header);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'Erwin Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Erwin Beerens');
    expect(compiled.querySelector('a[href="/resume"]')?.textContent).toContain('Resume');
    expect(compiled.querySelector('a[href="/projects"]')?.textContent).toContain('Projects');
    expect(compiled.querySelector('a[href="/contact"]')?.textContent).toContain('Contact');
  });

  it('does not fall back to a hard-coded profile name', async () => {
    await TestBed.configureTestingModule({ imports: [Header], providers: [provideRouter([])] }).compileComponents();

    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Alex Mercer');
  });
});
