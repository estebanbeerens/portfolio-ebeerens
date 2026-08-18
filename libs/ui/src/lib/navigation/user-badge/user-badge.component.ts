import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-user-badge',
  templateUrl: './user-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'border-border-subtle bg-glass flex w-full items-center gap-3 rounded-md border p-3',
  },
})
export class UserBadge {
  readonly name = input.required<string>();
  readonly status = input<string>();
  readonly avatarUrl = input<string>();

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  );
}
