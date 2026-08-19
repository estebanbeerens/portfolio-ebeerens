import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FeatureFlagDto, FeatureFlagsService } from '@portfolio-ebeerens/api-client';
import { Card, PageHeader, ToastService, Toggle } from '@portfolio-ebeerens/ui';

type FeatureFlagKey = FeatureFlagDto.KeyEnum;

const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, string> = {
  CONTACT: 'Contact',
  PROJECTS: 'Projects',
  ROLES: 'Roles',
  SKILLS: 'Skills',
};

@Component({
  selector: 'admin-feature-flags',
  imports: [Card, DatePipe, PageHeader, Toggle],
  templateUrl: './feature-flags.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class FeatureFlags {
  private readonly api = inject(FeatureFlagsService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly flagLabels = FEATURE_FLAG_LABELS;

  protected readonly flags = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.featureFlagsControllerFindAll(),
  });
  protected readonly flagList = computed(() => (this.flags.hasValue() ? this.flags.value() : undefined));
  protected readonly pendingKey = signal<FeatureFlagKey | undefined>(undefined);
  protected readonly requestError = computed(() => {
    const error = this.flags.error();
    return error instanceof HttpErrorResponse && error.status === 401
      ? 'Your session has expired. Sign in again to manage feature flags.'
      : error
        ? 'Feature flags could not be loaded. Try again.'
        : undefined;
  });

  protected retry(): void {
    this.flags.reload();
  }

  protected onToggle(flag: FeatureFlagDto): void {
    if (this.pendingKey() !== undefined) {
      return;
    }
    this.pendingKey.set(flag.key);
    this.api.featureFlagsControllerUpdate(flag.key, { enabled: !flag.enabled }).subscribe({
      next: (updated) => {
        this.pendingKey.set(undefined);
        this.toast.success(`${this.flagLabels[updated.key]} ${updated.enabled ? 'enabled' : 'disabled'}.`);
        // Patch the cached list in place instead of `reload()` to avoid a full loading-state flash.
        this.flags.update((list) => (list ?? []).map((f) => (f.key === updated.key ? updated : f)));
      },
      error: (error: unknown) => {
        this.pendingKey.set(undefined);
        this.toast.error(this.mutationError(error));
      },
    });
  }

  private mutationError(error: unknown): string {
    return error instanceof HttpErrorResponse && error.status === 401
      ? 'Your session has expired. Sign in again to manage feature flags.'
      : 'The request failed. Try again.';
  }
}
