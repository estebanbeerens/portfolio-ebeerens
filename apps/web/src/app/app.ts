import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AmbientBackdrop } from '@portfolio-ebeerens/ui';
import { Footer } from './layout/footer/footer.component';
import { Header } from './layout/header/header.component';
import { PortfolioContentService } from './shared/portfolio-content.service';

@Component({
  imports: [RouterModule, AmbientBackdrop, Header, Footer],
  selector: 'web-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-bg relative flex min-h-screen flex-col overflow-hidden' },
})
export class App {
  protected readonly content = inject(PortfolioContentService);
}
