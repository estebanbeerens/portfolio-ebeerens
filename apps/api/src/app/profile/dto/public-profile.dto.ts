import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { ProfileDto } from './profile.dto';

// Public-facing shape used only within the public-portfolio bundle: a single resolved language
// rather than the admin `*En`/`*Nl` pair.
export class PublicProfileDto extends OmitType(ProfileDto, ['bioEn', 'bioNl'] as const) {
  @ApiPropertyOptional({ description: 'Markdown source for the biography, resolved to the requested language' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Sanitized HTML rendered from `bio`' })
  bioHtml?: string;
}
