import { TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';
import { appRoutes } from '../../app.routes';
import { PrivacyPage } from './privacy-page.component';

describe('PrivacyPage', () => {
  it('is reachable without a feature flag and identifies the controller and privacy contact', async () => {
    const route = appRoutes.find((entry) => entry.path === 'privacy');
    expect(route?.canMatch).toBeUndefined();
    await TestBed.configureTestingModule({ imports: [PrivacyPage] }).compileComponents();
    const fixture = TestBed.createComponent(PrivacyPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Esteban Beerens');
    expect(element.querySelector('a[href="mailto:privacy@ebeerens.com"]')).not.toBeNull();
    expect(element.textContent).toContain('six calendar months');
    expect(element.textContent).toContain('twelve calendar months');
    const results = await axe(element);
    (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
  });
});
