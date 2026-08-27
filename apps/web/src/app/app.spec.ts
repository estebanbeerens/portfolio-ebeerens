import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureFlagDto, ProfileService } from '@portfolio-ebeerens/api-client';
import { of } from 'rxjs';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: ProfileService,
          useValue: {
            profileControllerGetPublicPortfolio: () =>
              of({
                profile: { id: 'profile-1', name: 'Alex Mercer', updatedAt: '2026-01-01' },
                roles: [],
                projects: [],
                featureFlags: [
                  { key: FeatureFlagDto.KeyEnum.Contact, enabled: false, updatedAt: '2026-01-01' },
                  { key: FeatureFlagDto.KeyEnum.Projects, enabled: false, updatedAt: '2026-01-01' },
                  { key: FeatureFlagDto.KeyEnum.Roles, enabled: false, updatedAt: '2026-01-01' },
                  { key: FeatureFlagDto.KeyEnum.Resume, enabled: false, updatedAt: '2026-01-01' },
                ],
              }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('renders the public web shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('web-header')).toBeTruthy();
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    expect(compiled.querySelector('web-footer')).toBeTruthy();
  });
});
