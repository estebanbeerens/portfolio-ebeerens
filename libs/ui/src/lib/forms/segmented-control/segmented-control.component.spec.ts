import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SegmentedControl, SegmentedControlOption } from './segmented-control.component';

@Component({
  imports: [SegmentedControl],
  template: `<ui-segmented-control label="Display mode" [options]="options" [(selected)]="selected" />`,
})
class HostComponent {
  options: SegmentedControlOption[] = [
    { value: 'list', label: 'List' },
    { value: 'timeline', label: 'Timeline' },
  ];
  selected = 'list';
}

describe('SegmentedControl', () => {
  it('marks the selected tab and moves the active indicator state on click', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const control = compiled.querySelector('.ui-segmented-control') as HTMLElement;
    const tabs = compiled.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;

    expect(control.getAttribute('aria-label')).toBe('Display mode');
    expect(control.style.getPropertyValue('--ui-segmented-index')).toBe('0');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toBe('timeline');
    expect(control.style.getPropertyValue('--ui-segmented-index')).toBe('1');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });
});
