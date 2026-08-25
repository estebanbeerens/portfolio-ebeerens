import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'web-role-description',
  templateUrl: './role-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDescription {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  readonly descriptionHtml = input.required<string>();
  readonly roleTitle = input.required<string>();
  protected readonly expanded = signal(false);
  protected readonly overflows = signal(false);

  constructor() {
    if (this.isBrowser) {
      afterNextRender(() => {
        const content = this.content().nativeElement;
        this.overflows.set(content.scrollHeight > content.clientHeight);
      });
    }
  }

  protected expand(): void {
    this.expanded.set(true);
  }
}
