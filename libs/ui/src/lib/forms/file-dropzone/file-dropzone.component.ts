import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LucideDynamicIcon, LucideUpload } from '@lucide/angular';

/**
 * Drag-and-drop / click-to-browse single-file picker. The consumer owns validation and upload.
 */
@Component({
  selector: 'ui-file-dropzone',
  imports: [LucideDynamicIcon],
  templateUrl: './file-dropzone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileDropzone {
  readonly accept = input('');
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly disabled = input(false);

  readonly fileSelected = output<File>();

  protected readonly uploadIcon = LucideUpload;
  protected readonly dragActive = signal(false);

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) {
      this.dragActive.set(true);
    }
  }

  protected onDragLeave(): void {
    this.dragActive.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    if (this.disabled()) {
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
