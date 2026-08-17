import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../theme.service';
import { LucideDynamicIcon, LucideSun, LucideMoon } from '@lucide/angular';

@Component({
  selector: 'lib-theme-toggle',
  imports: [LucideDynamicIcon],
  templateUrl: './theme-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
  protected readonly icon = computed(() => (this.themeService.theme() === 'light' ? LucideSun : LucideMoon));
}
