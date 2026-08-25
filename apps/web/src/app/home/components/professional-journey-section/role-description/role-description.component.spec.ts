import { TestBed } from '@angular/core/testing';
import { RoleDescription } from './role-description.component';

describe('RoleDescription', () => {
  it('renders a short description without an expansion control', async () => {
    await TestBed.configureTestingModule({
      imports: [RoleDescription],
    }).compileComponents();
    const fixture = TestBed.createComponent(RoleDescription);
    fixture.componentRef.setInput('descriptionHtml', '<p>Built accessible interfaces.</p>');
    fixture.componentRef.setInput('roleTitle', 'Frontend Engineer');
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Built accessible interfaces.');
    expect(root.querySelector('button')).toBeNull();
  });

  it('shows an accessible one-way expansion control for overflowing content', async () => {
    const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    const scrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 20 });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 60 });

    try {
      await TestBed.configureTestingModule({
        imports: [RoleDescription],
      }).compileComponents();
      const fixture = TestBed.createComponent(RoleDescription);
      fixture.componentRef.setInput('descriptionHtml', '<p>A longer role description.</p>');
      fixture.componentRef.setInput('roleTitle', 'Senior Engineer');
      await fixture.whenStable();

      const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.getAttribute('aria-label')).toBe('Show full description for Senior Engineer');
      button.click();
      await fixture.whenStable();

      expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
      expect((fixture.nativeElement as HTMLElement).querySelector('[data-expanded="true"]')).not.toBeNull();
    } finally {
      if (clientHeight) {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
      }
      if (scrollHeight) {
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeight);
      }
    }
  });
});
