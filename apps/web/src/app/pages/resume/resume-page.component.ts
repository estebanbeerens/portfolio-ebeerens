import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ProfessionalJourneySection } from '../../home/components/professional-journey-section/professional-journey-section.component';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

@Component({
  selector: 'web-resume-page',
  imports: [ProfessionalJourneySection],
  templateUrl: './resume-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePage {
  protected readonly content = inject(PortfolioContentService);

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Professional experience and career history.' });
  }
}
