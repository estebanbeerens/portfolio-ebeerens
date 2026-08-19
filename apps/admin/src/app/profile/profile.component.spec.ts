import { TestBed } from '@angular/core/testing';
import { ProfileDto, ProfileService } from '@portfolio-ebeerens/api-client';
import { ToastService } from '@portfolio-ebeerens/ui';
import { provideMarkdown } from 'ngx-markdown';
import { of, throwError } from 'rxjs';
import { Profile } from './profile.component';

const profile: ProfileDto = {
  id: 'profile-1',
  name: 'Jane Doe',
  headline: 'Frontend engineer',
  updatedAt: '2026-08-19T00:00:00.000Z',
};

describe('Profile', () => {
  function configure(api: Partial<ProfileService>, toast = { success: vi.fn(), error: vi.fn() }) {
    TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideMarkdown(),
        { provide: ProfileService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });
    return toast;
  }

  it('loads the existing profile into Basic Info form', async () => {
    configure({ profileControllerGetProfile: vi.fn(() => of(profile)) as never });
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#profile-name') as HTMLInputElement).value).toBe('Jane Doe');
  });

  it('explains a failed profile read but keeps the form available', async () => {
    configure({ profileControllerGetProfile: vi.fn(() => throwError(() => new Error('offline'))) as never });
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Basic Info could not be loaded. You can still create a profile below.');
    expect(fixture.nativeElement.querySelector('#profile-name')).not.toBeNull();
  });

  it('saves a valid profile and shows success feedback', async () => {
    const update = vi.fn(() => of(profile));
    const toast = configure({
      profileControllerGetProfile: vi.fn(() => of(profile)) as never,
      profileControllerUpdateProfile: update as never,
    });
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();

    const saveButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Save Basic Info'
    ) as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Doe', headline: 'Frontend engineer' }));
    expect(toast.success).toHaveBeenCalledWith('Basic Info saved.');
  });
});
