import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, type Data } from '@angular/router';
import { Card, PageHeader } from '@portfolio-ebeerens/ui';

@Component({
  selector: 'admin-placeholder-page',
  imports: [Card, PageHeader],
  template: `
    <ui-page-header [title]="title()" [subtitle]="subtitle()" />
    <ui-card>
      <p class="text-text-muted">This section hasn't been built yet.</p>
    </ui-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class PlaceholderPage {
  private readonly data = toSignal(inject(ActivatedRoute).data, { initialValue: {} as Data });

  protected readonly title = computed(() => (this.data()['title'] as string | undefined) ?? 'Admin');
  protected readonly subtitle = computed(() => this.data()['subtitle'] as string | undefined);
}
