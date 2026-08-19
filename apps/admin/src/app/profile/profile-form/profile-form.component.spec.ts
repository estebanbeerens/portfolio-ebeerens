import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileDto } from '@portfolio-ebeerens/api-client';
import { axe } from 'vitest-axe';
import { provideMarkdown } from 'ngx-markdown';
import { ProfileForm, ProfileFormValue } from './profile-form.component';

const profile: ProfileDto = {
  id: 'profile-1',
  name: 'Jane Doe',
  headline: 'Frontend engineer',
  location: 'Amsterdam, Netherlands',
  bio: '## About',
  githubUrl: 'https://github.com/jane-doe',
  updatedAt: '2026-08-19T00:00:00.000Z',
};

@Component({
  imports: [ProfileForm],
  template: `<admin-profile-form [profile]="profile" [saving]="saving" (saved)="savedValue = $event" />`,
})
class HostComponent {
  profile: ProfileDto | undefined;
  saving = false;
  savedValue: ProfileFormValue | undefined;
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  return Array.from(root.querySelectorAll('button')).find(
    (element) => (element as HTMLButtonElement).textContent?.trim() === text
  ) as HTMLButtonElement;
}

describe('ProfileForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideMarkdown()],
    }).compileComponents();
  });

  it('populates configured optional profile fields', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.profile = profile;
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#profile-name') as HTMLInputElement).value).toBe('Jane Doe');
    expect((fixture.nativeElement.querySelector('#profile-location') as HTMLInputElement).value).toBe(
      'Amsterdam, Netherlands'
    );
    expect((fixture.nativeElement.querySelector('#profile-github-url') as HTMLInputElement).value).toBe(
      'https://github.com/jane-doe'
    );
  });

  it('does not emit a profile when the required name is missing', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    button(fixture.nativeElement, 'Save Basic Info').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.savedValue).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter your name.');
  });

  it('emits a valid profile value and switches to Markdown preview', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const name = fixture.nativeElement.querySelector('#profile-name') as HTMLInputElement;
    const biography = fixture.nativeElement.querySelector('#profile-biography') as HTMLTextAreaElement;
    name.value = 'Jane Doe';
    name.dispatchEvent(new Event('input'));
    biography.value = '## Biography\n\nSafe **Markdown**.';
    biography.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    button(fixture.nativeElement, 'Preview').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#profile-biography')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="tabpanel"] markdown')).not.toBeNull();

    button(fixture.nativeElement, 'Save Basic Info').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.savedValue).toMatchObject({
      name: 'Jane Doe',
      bio: '## Biography\n\nSafe **Markdown**.',
    });
  });

  it('has no automated accessibility violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.profile = profile;
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    expect(results.violations).toEqual([]);
  });
});
