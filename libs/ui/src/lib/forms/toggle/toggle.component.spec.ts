import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { axe } from 'vitest-axe';
import { Toggle } from './toggle.component';

@Component({
  imports: [Toggle],
  template: `<ui-toggle
    [checked]="checked"
    [disabled]="disabled"
    [label]="label"
    [stretched]="stretched"
    (toggled)="toggledValue = $event"
  />`,
})
class HostComponent {
  checked = false;
  disabled = false;
  label = 'Enable feature';
  stretched = false;
  toggledValue: boolean | undefined;
}

describe('Toggle', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('reflects the checked input via role and aria-checked', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.checked = true;
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button');
    expect(button?.getAttribute('role')).toBe('switch');
    expect(button?.getAttribute('aria-checked')).toBe('true');
    expect(button?.getAttribute('aria-label')).toBe('Enable feature');
  });

  it('emits the inverted value on click', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.toggledValue).toBe(true);
  });

  it('does not emit when disabled', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled = true;
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.toggledValue).toBeUndefined();
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('extends the hit area with a stretched pseudo-element when requested', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.stretched = true;
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button');
    expect(button?.className).toContain('before:absolute');
  });
});
