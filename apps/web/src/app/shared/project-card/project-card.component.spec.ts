import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicProjectDto } from '@portfolio-ebeerens/api-client';
import { ProjectCard } from './project-card.component';

describe('ProjectCard', () => {
  const project: PublicProjectDto = {
    id: 'project-1',
    title: 'Aether Dashboard',
    slug: 'aether-dashboard',
    shortDescription: 'A real-time analytics cockpit.',
    description: 'Long description',
    startDate: '2024-01-01',
    skills: [{ id: 'skill-1', name: 'TypeScript' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as unknown as PublicProjectDto;

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [ProjectCard],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', project);
    await fixture.whenStable();
    return fixture;
  }

  it('renders title, skill summary, and links to the project slug route', async () => {
    const fixture = await createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aether Dashboard');
    expect(compiled.textContent).toContain('TypeScript');
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('/projects/aether-dashboard');
  });

  it('renders the project image when imageUrl is present', async () => {
    const fixture = await createComponent();
    fixture.componentRef.setInput('project', { ...project, imageUrl: 'https://cdn.example.com/preview.png' });
    await fixture.whenStable();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(img?.src).toBe('https://cdn.example.com/preview.png');
  });

  it('renders a gradient placeholder alternating tone by index when there is no image', async () => {
    const fixture = await createComponent();
    fixture.componentRef.setInput('index', 1);
    await fixture.whenStable();

    const placeholder = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(placeholder).toBeNull();
    const gradient = fixture.nativeElement.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(gradient.classList.contains('from-violet-500')).toBe(true);
  });
});
