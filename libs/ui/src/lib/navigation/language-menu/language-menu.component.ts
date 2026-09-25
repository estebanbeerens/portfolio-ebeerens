import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideCheck, LucideChevronDown, LucideDynamicIcon } from '@lucide/angular';

type SupportedLanguage = 'en' | 'nl';

interface LanguageOption {
  readonly code: SupportedLanguage;
  readonly label: string;
}

@Component({
  selector: 'ui-language-menu',
  imports: [LucideDynamicIcon],
  templateUrl: './language-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // No static display utility here: consumers toggle visibility per breakpoint via "hidden"/"inline-flex" classes.
  host: { class: 'relative' },
})
export class LanguageMenu {
  private readonly locale = inject(LOCALE_ID) as SupportedLanguage;
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);
  protected readonly currentLanguage = computed<SupportedLanguage>(() => (this.locale === 'nl' ? 'nl' : 'en'));
  protected readonly languages: readonly LanguageOption[] = [
    { code: 'en', label: 'English' },
    { code: 'nl', label: 'Nederlands' },
  ];
  protected readonly chevronIcon = LucideChevronDown;
  protected readonly checkIcon = LucideCheck;

  protected languageHref(language: SupportedLanguage): string {
    return `/${language}${this.router.url}`;
  }

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
