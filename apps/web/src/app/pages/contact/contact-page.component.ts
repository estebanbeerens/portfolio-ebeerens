import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'web-contact-page',
  template: `
    <section
      class="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col gap-4 p-6 lg:px-10"
      aria-labelledby="contact-title"
    >
      <p class="dark:text-accent font-mono text-xs text-cyan-900 uppercase">Contact</p>
      <h1 id="contact-title" class="font-display text-text text-4xl font-bold">Get In Touch</h1>
      <p class="text-text-muted max-w-2xl">A dedicated contact page is coming soon.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {}
