export const SUPPORTED_LOCALES = ['en', 'nl'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

// Anything unrecognized (missing header, malformed value, unsupported language) falls back to English.
export function resolveLocale(header?: string): Locale {
  const normalized = header?.toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(normalized ?? '') ? (normalized as Locale) : 'en';
}

// Required-field variant: `en` is always populated, `nl` returns '' rather than falling back to English.
export function pickLocalized(en: string, nl: string | null | undefined, locale: Locale): string {
  return locale === 'nl' ? (nl ?? '') : en;
}

// Optional-field variant: no cross-language fallback, per product decision.
export function pickLocalizedOptional(
  en: string | null | undefined,
  nl: string | null | undefined,
  locale: Locale
): string | undefined {
  const value = locale === 'nl' ? nl : en;
  return value ?? undefined;
}
