import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';
import { FormField } from './form-field.component';

@Component({
  imports: [FormField],
  template: `
    <ui-form-field label="Title" for="title-input" [hint]="hint" [error]="error" [required]="required">
      <input id="title-input" [value]="value" />
    </ui-form-field>
  `,
})
class HostComponent {
  hint: string | undefined;
  error: string | undefined;
  required = false;
  value = '';
}

describe('FormField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('associates the label with the projected control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe('title-input');
    expect(label.textContent).toContain('Title');
  });

  it('renders a hint when provided', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.hint = 'Some helpful text';
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Some helpful text');
  });

  it('renders an error as an alert when provided', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'This field is required.';
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('This field is required.');
  });

  it('marks the label as required', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.required = true;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('required');
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.hint = 'Some helpful text';
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
