import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanMatchFn, UrlSegment } from '@angular/router';
import { PortfolioContentService } from './shared/portfolio-content.service';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  function resumeCanMatch(): boolean {
    const route = appRoutes.find((candidate) => candidate.path === 'resume');
    const canMatch = route?.canMatch?.[0] as CanMatchFn | undefined;
    if (!route || typeof canMatch !== 'function') {
      throw new Error('Resume route is missing its feature-flag guard.');
    }
    return TestBed.runInInjectionContext(
      () => canMatch(route, [] as UrlSegment[], {} as Parameters<CanMatchFn>[2]) as boolean
    );
  }

  it('matches the resume route only when the resume flag is enabled', () => {
    const resumeEnabled = signal(false);
    TestBed.configureTestingModule({
      providers: [{ provide: PortfolioContentService, useValue: { resumeEnabled } }],
    });

    expect(resumeCanMatch()).toBe(false);
    resumeEnabled.set(true);
    expect(resumeCanMatch()).toBe(true);
  });
});
