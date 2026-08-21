import { effect, inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PortfolioContentService } from './shared/portfolio-content.service';

@Injectable({ providedIn: 'root' })
export class PortfolioTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly content = inject(PortfolioContentService);
  private pageTitle: string | undefined;

  constructor() {
    super();
    effect(() => this.updateDocumentTitle(this.pageTitle, this.profileName()));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.setPageTitle(this.buildTitle(snapshot) ?? undefined);
  }

  setPageTitle(pageTitle: string | undefined): void {
    this.pageTitle = pageTitle;
    this.updateDocumentTitle(pageTitle, this.profileName());
  }

  private profileName(): string | undefined {
    return typeof this.content.profileValue === 'function' ? this.content.profileValue()?.name : undefined;
  }

  private updateDocumentTitle(pageTitle: string | undefined, profileName: string | undefined): void {
    const siteName = profileName?.trim() || 'Portfolio';
    this.title.setTitle(pageTitle ? `${pageTitle} | ${siteName}` : siteName);
  }
}
