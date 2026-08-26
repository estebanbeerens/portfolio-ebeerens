import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { Card } from '@portfolio-ebeerens/ui';
import { projectSkillSummary, projectYear } from '../project-summary.util';
import { PROJECT_IMAGE_NG_SRCSET } from '../r2-image-loader';

@Component({
  selector: 'web-project-card',
  imports: [Card, NgOptimizedImage, RouterLink],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<ProjectDto>();
  // Alternates the placeholder gradient tone when a project has no image; pass the item's list index.
  readonly index = input(0);

  protected readonly projectYear = projectYear;
  protected readonly skillSummary = projectSkillSummary;
  protected readonly imageNgSrcset = PROJECT_IMAGE_NG_SRCSET;

  protected isCyanTone(): boolean {
    return this.index() % 2 === 0;
  }
}
