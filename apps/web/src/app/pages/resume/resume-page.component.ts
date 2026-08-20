import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'web-resume-page',
  template: `
    <section
      class="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col gap-4 p-6 lg:px-10"
      aria-labelledby="resume-title"
    >
      <p class="dark:text-accent font-mono text-xs text-cyan-900 uppercase">Curriculum Vitae</p>
      <h1 id="resume-title" class="font-display text-text text-4xl font-bold">Resume</h1>
      <p class="text-text-muted max-w-2xl">A dedicated resume page is coming soon.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePage {}
