import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EngineeredArtifactsSection } from './engineered-artifacts-section.component';

describe('EngineeredArtifactsSection', () => {
  it('renders project cards that link to project slug routes', async () => {
    await TestBed.configureTestingModule({
      imports: [EngineeredArtifactsSection],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EngineeredArtifactsSection);
    fixture.componentRef.setInput('projects', [
      {
        id: 'project-1',
        title: 'Aether Dashboard',
        slug: 'aether-dashboard',
        shortDescription: 'A real-time analytics cockpit.',
        description: 'Long description',
        startDate: '2024-01-01',
        skills: [{ id: 'skill-1', name: 'TypeScript' }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aether Dashboard');
    expect(compiled.textContent).toContain('TypeScript');
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('/projects/aether-dashboard');
  });
});
