import { Locale, pickLocalized, pickLocalizedOptional } from './locale.util';
import { MarkdownRenderService } from './markdown-render.service';

interface ProjectLike {
  shortDescriptionEn: string;
  shortDescriptionNl: string | null;
  descriptionEn: string;
  descriptionNl: string | null;
}

type PublicProject<T extends ProjectLike> = Omit<
  T,
  'shortDescriptionEn' | 'shortDescriptionNl' | 'descriptionEn' | 'descriptionNl'
> & {
  shortDescription: string;
  description: string;
  descriptionHtml?: string;
};

// Shared by the public-portfolio bundle and the related-projects endpoint, the only two public-facing project reads.
export function toPublicProject<T extends ProjectLike>(
  project: T,
  locale: Locale,
  markdown: MarkdownRenderService
): PublicProject<T> {
  const { shortDescriptionEn, shortDescriptionNl, descriptionEn, descriptionNl, ...rest } = project;
  const shortDescription = pickLocalized(shortDescriptionEn, shortDescriptionNl, locale);
  const description = pickLocalized(descriptionEn, descriptionNl, locale);
  return {
    ...rest,
    shortDescription,
    description,
    descriptionHtml: description ? markdown.render(description) : undefined,
  } as PublicProject<T>;
}

interface RoleLike {
  descriptionEn: string | null;
  descriptionNl: string | null;
}

type PublicRole<T extends RoleLike> = Omit<T, 'descriptionEn' | 'descriptionNl'> & {
  description?: string;
  descriptionHtml?: string;
};

export function toPublicRole<T extends RoleLike>(
  role: T,
  locale: Locale,
  markdown: MarkdownRenderService
): PublicRole<T> {
  const { descriptionEn, descriptionNl, ...rest } = role;
  const description = pickLocalizedOptional(descriptionEn, descriptionNl, locale);
  return {
    ...rest,
    description,
    descriptionHtml: description ? markdown.render(description) : undefined,
  } as PublicRole<T>;
}
