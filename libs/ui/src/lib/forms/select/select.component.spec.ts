import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe } from 'vitest-axe';
import { Select, SelectOption } from './select.component';

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `<ui-select
    [formControl]="control"
    controlId="employment-type"
    label="Employment type"
    [options]="options"
    [error]="error"
  />`,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
  readonly options: SelectOption[] = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
  ];
  error: string | undefined;
}

describe('Select', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the control value', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.setValue('PART_TIME');
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('PART_TIME');
  });

  it('renders every option', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const options = fixture.nativeElement.querySelectorAll('option[value]:not([value=""])');
    expect(options).toHaveLength(2);
    expect((options[0] as HTMLOptionElement).textContent).toContain('Full-time');
  });

  it('propagates a selection change to the form control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'FULL_TIME';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe('FULL_TIME');
  });

  it('reflects the disabled state from the form control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.disable();
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('marks the control invalid via aria-invalid when an error is set', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'Select an employment type.';
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
