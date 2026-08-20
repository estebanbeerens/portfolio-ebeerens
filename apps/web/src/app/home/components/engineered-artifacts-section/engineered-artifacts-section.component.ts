import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { Card } from '@portfolio-ebeerens/ui';
import { ProjectCard } from '../../../shared/project-card/project-card.component';

@Component({
  selector: 'web-engineered-artifacts-section',
  imports: [Card, ProjectCard],
  templateUrl: './engineered-artifacts-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineeredArtifactsSection {
  readonly projects = input<readonly ProjectDto[]>([]);
}
