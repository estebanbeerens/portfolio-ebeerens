import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LanguageMenu } from './language-menu.component';

describe('LanguageMenu', () => {
  it('opens a menu with a flag icon per language and links to each localized bundle', async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageMenu],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'en' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageMenu);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('EN');

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(menu).toBeTruthy();
    expect(menu.querySelectorAll('a svg').length).toBeGreaterThanOrEqual(2);
    expect((menu.querySelector('a[href="/en/"]') as HTMLAnchorElement).textContent).toContain('English');
    expect((menu.querySelector('a[href="/nl/"]') as HTMLAnchorElement).textContent).toContain('Nederlands');
  });

  it('closes the menu when Escape is pressed', async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageMenu],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'nl' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageMenu);
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu when clicking outside of it', async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageMenu],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'nl' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageMenu);
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
