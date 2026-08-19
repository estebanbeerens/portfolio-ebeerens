import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe } from 'vitest-axe';
import { TagCombobox } from './tag-combobox.component';

@Component({
  imports: [ReactiveFormsModule, TagCombobox],
  template: `<ui-tag-combobox [formControl]="control" label="Skills" [options]="options" />`,
})
class HostComponent {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
  readonly options = ['Angular', 'NestJS'];
}

describe('TagCombobox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders existing values as chips', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.setValue(['angular']);
    await fixture.whenStable();

    const chips = fixture.nativeElement.querySelectorAll('span button');
    expect(chips.length).toBe(1);
  });

  it('adds a typed value on Enter, normalized to lowercase', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Figma';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toEqual(['figma']);
  });

  it('removes a chip when its remove button is clicked', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.setValue(['angular', 'nestjs']);
    await fixture.whenStable();

    const removeButton = fixture.nativeElement.querySelector('span button') as HTMLButtonElement;
    removeButton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toEqual(['nestjs']);
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
