import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';
import { FileDropzone } from './file-dropzone.component';

@Component({
  imports: [FileDropzone],
  template: `<ui-file-dropzone
    label="Drag & drop a file"
    hint="PDF up to 5MB"
    [disabled]="disabled"
    (fileSelected)="selected = $event"
  />`,
})
class HostComponent {
  disabled = false;
  selected?: File;
}

function file(name = 'resume.pdf'): File {
  return new File(['content'], name, { type: 'application/pdf' });
}

describe('FileDropzone', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the label and hint', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Drag & drop a file');
    expect(fixture.nativeElement.textContent).toContain('PDF up to 5MB');
  });

  it('emits the dropped file', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const zone = fixture.nativeElement.querySelector('label') as HTMLElement;
    const dropped = file();
    const dataTransfer = { files: [dropped] } as unknown as DataTransfer;
    zone.dispatchEvent(Object.assign(new Event('drop'), { dataTransfer }));
    await fixture.whenStable();

    expect(fixture.componentInstance.selected).toBe(dropped);
  });

  it('emits the file chosen through the native file input', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const chosen = file();
    Object.defineProperty(input, 'files', { value: [chosen] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.selected).toBe(chosen);
  });

  it('ignores drops while disabled', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled = true;
    await fixture.whenStable();

    const zone = fixture.nativeElement.querySelector('label') as HTMLElement;
    const dataTransfer = { files: [file()] } as unknown as DataTransfer;
    zone.dispatchEvent(Object.assign(new Event('drop'), { dataTransfer }));
    await fixture.whenStable();

    expect(fixture.componentInstance.selected).toBeUndefined();
  });

  it('is reachable from the keyboard via the wrapped file input', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
