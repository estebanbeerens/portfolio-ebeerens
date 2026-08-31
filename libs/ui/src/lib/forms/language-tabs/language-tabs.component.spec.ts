import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageTabs, FormLanguage } from './language-tabs.component';

@Component({
  imports: [LanguageTabs],
  template: `<ui-language-tabs label="Description language" panelId="panel-1" [(language)]="language" />`,
})
class HostComponent {
  language: FormLanguage = 'en';
}

describe('LanguageTabs', () => {
  it('marks the English tab selected by default and switches on click', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    expect(tabs[0].textContent?.trim()).toBe('English');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.language).toBe('nl');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });
});
