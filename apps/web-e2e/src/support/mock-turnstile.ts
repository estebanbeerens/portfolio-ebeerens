import { Page } from '@playwright/test';

/**
 * Stubs the Cloudflare Turnstile widget so contact-form e2e tests don't depend on
 * a real network round trip to challenges.cloudflare.com. Serves a fake `window.turnstile`
 * that auto-resolves with a fixed token as soon as a widget is rendered.
 */
export async function mockTurnstile(page: Page) {
  await page.route('**/runtime-config.json', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: { turnstileSiteKey: 'e2e-test-site-key' } });
  });

  await page.route('**/challenges.cloudflare.com/turnstile/v0/api.js**', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.turnstile = {
          render: (el, options) => {
            setTimeout(() => options.callback('e2e-turnstile-token'), 0);
            return 'e2e-widget-id';
          },
          reset: () => {},
          remove: () => {},
        };
        if (typeof window.onloadTurnstileCallback === 'function') {
          window.onloadTurnstileCallback();
        }
      `,
    });
  });
}
