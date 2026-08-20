import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer.component';

describe('Footer', () => {
  it('renders all social links provided by the profile, including Instagram and YouTube', async () => {
    await TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([])] }).compileComponents();

    const fixture = TestBed.createComponent(Footer);
    fixture.componentRef.setInput('profile', {
      id: 'profile-1',
      name: 'Erwin Beerens',
      githubUrl: 'https://github.com/erwin',
      linkedinUrl: 'https://linkedin.com/in/erwin',
      instagramUrl: 'https://instagram.com/erwin',
      youtubeUrl: 'https://youtube.com/@erwin',
      xUrl: 'https://x.com/erwin',
      updatedAt: '2026-01-01',
    });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="https://instagram.com/erwin"]')?.textContent).toContain('Instagram');
    expect(compiled.querySelector('a[href="https://youtube.com/@erwin"]')?.textContent).toContain('YouTube');
  });

  it('omits social links that are not provided', async () => {
    await TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([])] }).compileComponents();

    const fixture = TestBed.createComponent(Footer);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'Erwin Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Instagram');
    expect(text).not.toContain('YouTube');
  });
});
