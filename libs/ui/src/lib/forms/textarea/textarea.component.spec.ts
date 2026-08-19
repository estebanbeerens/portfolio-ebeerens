import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe } from 'vitest-axe';
import { Textarea } from './textarea.component';

@Component({
  imports: [ReactiveFormsModule, Textarea],
  template: `<ui-textarea [formControl]="control" controlId="description" label="Description" [error]="error" />`,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
  error: string | undefined;
}

describe('Textarea', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the control value', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.setValue('Some markdown');
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Some markdown');
  });

  it('propagates typed input to the form control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Updated text';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe('Updated text');
  });

  it('marks the control invalid via aria-invalid when an error is set', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'Enter a description.';
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
