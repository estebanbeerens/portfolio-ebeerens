import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileService, UpdateProfileDto } from '@portfolio-ebeerens/api-client';
import { PageHeader, ToastService } from '@portfolio-ebeerens/ui';
import { ProfileForm, ProfileFormValue } from './profile-form/profile-form.component';
import { ResumeUpload } from './resume-upload/resume-upload.component';

@Component({
  selector: 'admin-profile',
  imports: [PageHeader, ProfileForm, ResumeUpload],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class Profile {
  private readonly api = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly resource = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.profileControllerGetProfile(),
  });
  protected readonly profile = computed(() => (this.resource.hasValue() ? this.resource.value() : undefined));
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | undefined>(undefined);
  protected readonly isLoading = computed(() => !this.resource.hasValue() && !this.resource.error());
  protected readonly requestError = computed(() => {
    const error = this.resource.error();
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return undefined;
    }
    return error ? 'Basic Info could not be loaded. You can still create a profile below.' : undefined;
  });

  protected save(value: ProfileFormValue): void {
    if (this.saving()) {
      return;
    }

    this.formError.set(undefined);
    this.saving.set(true);
    this.api.profileControllerUpdateProfile(this.toPayload(value)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Basic Info saved.');
        this.resource.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const message =
          error instanceof HttpErrorResponse && error.status === 401
            ? 'Your session has expired. Sign in again to update Basic Info.'
            : 'Basic Info could not be saved. Check the form and try again.';
        this.formError.set(message);
        this.toast.error(message);
      },
    });
  }

  protected retry(): void {
    this.resource.reload();
  }

  private toPayload(value: ProfileFormValue): UpdateProfileDto {
    return {
      name: value.name,
      ...(value.headline ? { headline: value.headline } : {}),
      ...(value.location ? { location: value.location } : {}),
      ...(value.bioEn ? { bioEn: value.bioEn } : {}),
      ...(value.bioNl ? { bioNl: value.bioNl } : {}),
      ...(value.avatarUrl ? { avatarUrl: value.avatarUrl } : {}),
      ...(value.linkedinUrl ? { linkedinUrl: value.linkedinUrl } : {}),
      ...(value.githubUrl ? { githubUrl: value.githubUrl } : {}),
      ...(value.instagramUrl ? { instagramUrl: value.instagramUrl } : {}),
      ...(value.xUrl ? { xUrl: value.xUrl } : {}),
      ...(value.youtubeUrl ? { youtubeUrl: value.youtubeUrl } : {}),
    };
  }
}
