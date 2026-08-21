import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Button } from '@portfolio-ebeerens/ui';
import { EngineeredArtifactsSection } from './components/engineered-artifacts-section/engineered-artifacts-section.component';
import { HeroSection } from './components/hero-section/hero-section.component';
import { ProfessionalJourneySection } from './components/professional-journey-section/professional-journey-section.component';
import { PortfolioContentService } from '../shared/portfolio-content.service';

@Component({
  selector: 'web-home-page',
  imports: [Button, EngineeredArtifactsSection, HeroSection, ProfessionalJourneySection, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly content = inject(PortfolioContentService);
  protected readonly selectedProjects = computed(() => this.content.selectedProjects());

  constructor() {
    const title = inject(Title);
    const meta = inject(Meta);
    title.setTitle('Home');
    meta.updateTag({ name: 'description', content: 'Portfolio, projects, and professional journey.' });
  }
}
