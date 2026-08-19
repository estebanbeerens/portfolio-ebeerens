import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';
import { Button } from './button.component';

@Component({
  imports: [Button],
  template: `
    <button uiButton type="button">Filled</button>
    <button uiButton variant="outlined" type="button">Outlined</button>
    <button uiButton variant="outlined" tone="danger" type="button">Danger</button>
  `,
})
class HostComponent {}

describe('Button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('applies filled styling by default', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect((buttons[0] as HTMLButtonElement).className).toContain('bg-accent');
  });

  it('applies outlined styling', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect((buttons[1] as HTMLButtonElement).className).toContain('border-border');
  });

  it('applies danger tone styling', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect((buttons[2] as HTMLButtonElement).className).toContain('text-error');
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
