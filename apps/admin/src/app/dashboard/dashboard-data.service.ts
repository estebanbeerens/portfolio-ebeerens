import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DashboardService as DashboardApi } from '@portfolio-ebeerens/api-client';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly api = inject(DashboardApi);

  // Gating params on isBrowser (undefined = skip) avoids querying it during SSR.
  private readonly summary = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.dashboardControllerGetSummary(),
  });

  // resource.value() throws while the resource is in an error state, so gate on hasValue().
  readonly data = computed(() => (this.summary.hasValue() ? this.summary.value() : undefined));
  readonly isLoading = computed(() => !this.summary.hasValue() && !this.summary.error());
  readonly hasError = computed(() => Boolean(this.summary.error()));

  reload(): void {
    this.summary.reload();
  }
}
