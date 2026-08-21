import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { EngineeredArtifactsSection } from '../../home/components/engineered-artifacts-section/engineered-artifacts-section.component';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

@Component({
  selector: 'web-projects-page',
  imports: [EngineeredArtifactsSection],
  template: `
    <div class="mx-auto w-full max-w-7xl p-6 lg:px-10">
      <web-engineered-artifacts-section [projects]="content.sortedProjects()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  protected readonly content = inject(PortfolioContentService);

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Selected engineering and design projects.' });
  }
}
