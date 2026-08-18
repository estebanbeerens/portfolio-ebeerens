import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  githubUserId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}
