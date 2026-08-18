import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ActivityItem,
  ActivityList,
  Card,
  PageHeader,
  QuickAction,
  RelativeTimePipe,
  StatCard,
} from '@portfolio-ebeerens/ui';
import { LucideCalendar, LucideDownload, LucideFolder, LucideTag } from '@lucide/angular';
import { DashboardDataService } from './dashboard-data.service';
import { DASHBOARD_QUICK_ACTIONS, activityIcon } from './dashboard.config';

@Component({
  selector: 'admin-dashboard',
  imports: [ActivityItem, ActivityList, Card, PageHeader, QuickAction, RelativeTimePipe, RouterLink, StatCard],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class Dashboard {
  private readonly dashboard = inject(DashboardDataService);
  private readonly datePipe = new DatePipe('en-US');

  protected readonly quickActions = DASHBOARD_QUICK_ACTIONS;
  protected readonly isLoading = this.dashboard.isLoading;
  protected readonly hasError = this.dashboard.hasError;

  protected readonly stats = computed(() => {
    const data = this.dashboard.data();
    const since = data?.experienceStartDate ? this.datePipe.transform(data.experienceStartDate, 'MMMM y') : undefined;

    return [
      {
        label: 'Total projects',
        value: format(data?.totalProjects),
        hint: undefined,
        icon: LucideFolder,
      },
      {
        label: 'Years experience',
        value: data?.yearsExperience === undefined ? '—' : `${data.yearsExperience}+`,
        hint: since ? `Since ${since}` : undefined,
        icon: LucideCalendar,
      },
      {
        label: 'Total skills',
        value: format(data?.totalSkills),
        hint: 'Tagged in work',
        icon: LucideTag,
      },
      {
        label: 'Resume downloads',
        value: format(data?.resumeDownloadsLast30Days),
        hint: 'Past 30 days',
        icon: LucideDownload,
      },
    ];
  });

  protected readonly activity = computed(() =>
    (this.dashboard.data()?.recentActivity ?? []).map((entry) => ({
      id: entry.id,
      title: entry.summary,
      at: entry.createdAt,
      actor: entry.actor,
      icon: activityIcon(entry.entityType, entry.action),
    }))
  );

  protected reload(): void {
    this.dashboard.reload();
  }
}

function format(value?: number): string {
  return value === undefined ? '—' : String(value);
}
