import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe } from 'vitest-axe';
import { TextInput } from './input.component';

@Component({
  imports: [ReactiveFormsModule, TextInput],
  template: `<ui-input [formControl]="control" controlId="title" label="Title" [error]="error" />`,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
  error: string | undefined;
}

describe('TextInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the control value', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.setValue('Portfolio site');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Portfolio site');
  });

  it('propagates typed input to the form control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'New title';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe('New title');
  });

  it('marks the control invalid via aria-invalid when an error is set', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'Enter a title.';
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
