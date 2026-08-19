import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileDto } from '@portfolio-ebeerens/api-client';
import { Button, Card, TextInput } from '@portfolio-ebeerens/ui';
import { MarkdownComponent } from 'ngx-markdown';

export interface ProfileFormValue {
  name: string;
  headline: string;
  location: string;
  bio: string;
  avatarUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  instagramUrl: string;
  xUrl: string;
  youtubeUrl: string;
}

@Component({
  selector: 'admin-profile-form',
  imports: [Button, Card, MarkdownComponent, ReactiveFormsModule, TextInput],
  templateUrl: './profile-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly profile = input<ProfileDto>();
  readonly saving = input(false);
  readonly formError = input<string>();
  readonly saved = output<ProfileFormValue>();

  protected readonly biographyView = signal<'markdown' | 'preview'>('markdown');
  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
    headline: ['', Validators.maxLength(200)],
    location: ['', Validators.maxLength(200)],
    bio: ['', Validators.maxLength(20000)],
    avatarUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    linkedinUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    githubUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    instagramUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    xUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    youtubeUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
  });

  constructor() {
    effect(() => {
      const profile = this.profile();
      this.biographyView.set('markdown');
      this.form.reset({
        name: profile?.name ?? '',
        headline: profile?.headline ?? '',
        location: profile?.location ?? '',
        bio: profile?.bio ?? '',
        avatarUrl: profile?.avatarUrl ?? '',
        linkedinUrl: profile?.linkedinUrl ?? '',
        githubUrl: profile?.githubUrl ?? '',
        instagramUrl: profile?.instagramUrl ?? '',
        xUrl: profile?.xUrl ?? '',
        youtubeUrl: profile?.youtubeUrl ?? '',
      });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }

  protected fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return control !== null && control.invalid && control.touched;
  }

  protected readonly biographyIsPreview = computed(() => this.biographyView() === 'preview');
}
