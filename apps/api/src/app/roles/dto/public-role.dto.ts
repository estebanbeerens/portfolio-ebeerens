import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { RoleDto } from './role.dto';

// Public-facing shape used only within the public-portfolio bundle: a single resolved language
// rather than the admin `*En`/`*Nl` pair.
export class PublicRoleDto extends OmitType(RoleDto, ['descriptionEn', 'descriptionNl'] as const) {
  @ApiPropertyOptional({
    description:
      'Markdown source describing responsibilities and achievements in this role, resolved to the requested language',
  })
  description?: string;

  @ApiPropertyOptional({ description: 'Sanitized HTML rendered from `description`' })
  descriptionHtml?: string;
}
