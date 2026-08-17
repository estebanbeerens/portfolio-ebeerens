import { TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';
import { ThemeService } from '../theme.service';
import { ThemeToggle } from './theme-toggle.component';

describe('ThemeToggle', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
  });

  it('renders an accessible toggle button', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Toggle dark mode');
    expect(button?.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles the theme on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();

    const themeService = TestBed.inject(ThemeService);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(themeService.theme()).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
