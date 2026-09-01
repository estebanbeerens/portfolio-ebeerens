import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { SegmentedControl, SegmentedControlOption } from '@portfolio-ebeerens/ui';
import {
  projectDateRange,
  projectSkillSummary,
  projectYear,
  projectYearRange,
} from '../../shared/project-summary.util';
import { ProjectsContentService } from './projects-content.service';

@Component({
  selector: 'web-projects-page',
  imports: [DatePipe, RouterLink, SegmentedControl],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  private readonly projectsContent = inject(ProjectsContentService);
  protected readonly sortedProjects = computed(() => this.projectsContent.sortedProjects());
  protected readonly displayMode = signal<'list' | 'timeline'>('list');
  protected readonly displayModeLabel = $localize`:@@projects.displayModeLabel:Project display mode`;
  protected readonly displayModeOptions: readonly SegmentedControlOption[] = [
    { value: 'list', label: $localize`:@@projects.listMode:List` },
    { value: 'timeline', label: $localize`:@@projects.timelineMode:Timeline` },
  ];
  protected readonly projectDateRange = projectDateRange;
  protected readonly projectYear = projectYear;
  protected readonly projectYearRange = projectYearRange;
  protected readonly projectSkillSummary = projectSkillSummary;

  protected setDisplayMode(displayMode: string): void {
    if (displayMode === 'list' || displayMode === 'timeline') {
      this.displayMode.set(displayMode);
    }
  }

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Selected engineering and design projects.' });
  }
}
